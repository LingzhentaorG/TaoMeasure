"use strict";

const UNIVERSAL_COMMON_FIELDS = ["B", "L", "H", "X", "Y", "Z", "x", "y", "h"];
const UNIVERSAL_POINT_FIELDS = ["name", "B", "L", "H", "X", "Y", "Z", "x", "y", "h"];
const UNIVERSAL_IMPORT_LABELS = {
    common: "公共点数据",
    points: "待转换点数据",
    results: "转换结果数据",
    seven: "七参数",
    four: "四参数",
    source_system: "原始坐标系统",
    target_system: "目标坐标系统",
};


const DECIMAL_SETTING_PRESETS = Object.freeze({
    table: [
        { id: "angle", label: "经纬度 B/L (°)", default: 8, min: 4, max: 10 },
        { id: "height", label: "高程 H/h (m)", default: 3, min: 0, max: 6 },
        { id: "cartesian", label: "空间直角坐标 X/Y/Z (m)", default: 4, min: 0, max: 6 },
        { id: "plane", label: "平面坐标 x/y (m)", default: 3, min: 0, max: 6 },
    ],
    report: [
        { id: "angle", label: "经纬度 B/L (°)", default: 8, min: 4, max: 10 },
        { id: "height", label: "高程 H/h (m)", default: 3, min: 0, max: 6 },
        { id: "cartesian", label: "空间直角坐标 X/Y/Z (m)", default: 4, min: 0, max: 6 },
        { id: "plane", label: "平面坐标 x/y (m)", default: 3, min: 0, max: 6 },
        { id: "parameterTranslation", label: "平移参数 ΔX/ΔY/ΔZ (m)", default: 6, min: 0, max: 8 },
        { id: "parameterRotation", label: "旋转参数 (″)", default: 6, min: 0, max: 8 },
        { id: "parameterScale", label: "尺度参数 (ppm)", default: 6, min: 0, max: 8 },
        { id: "accuracy", label: "精度指标 (m)", default: 4, min: 0, max: 6 },
    ],
});

class CoordinateUniversalApp {
    constructor() {
        this.apiUrl = this._resolveApiUrl();
        this.metadata = { ellipsoids: [] };
        this.manualModes = { seven: false, four: false };
        this.lastResults = [];
        this.latestSevenParameters = null;
        this.latestFourParameters = null;
        this.latestAccuracy = null;
        this.elements = {};
        this.currentImportTarget = null;
        this.importFileInputs = {};
        // 字段映射相关变量
        this.fieldMappingData = null;
        this.fieldMappingConfig = {};
        this.exportContext = null;
        this.decimalOverrideCache = {};
        this.initialize();
    }

    _resolveApiUrl() {
        let baseUrl = "";
        if (window.__TAOMEASURE_API__) {
            baseUrl = window.__TAOMEASURE_API__;
        } else if (window.__TAOMEASURE_RESOLVED_API__) {
            baseUrl = window.__TAOMEASURE_RESOLVED_API__;
        } else if (typeof window.__resolveTaoMeasureApiBase === "function") {
            baseUrl = window.__resolveTaoMeasureApiBase();
        } else {
            const protocol = window.location.protocol && window.location.protocol !== "file:" ? window.location.protocol : "http:";
            let host = window.location.hostname || "127.0.0.1";
            if (host === "::" || host === "[::]" || host === "0.0.0.0") {
                host = "127.0.0.1";
            }
            if (host.includes(":") && !host.startsWith("[") && !host.endsWith("]")) {
                host = `[${host}]`;
            }
            baseUrl = `${protocol}//${host}:5000`;
        }
        return `${baseUrl.replace(/\/+$/, "")}/api/coordinate/universal`;
    }

    initialize() {
        this.cacheElements();
        if (!this.elements.wrapper) {
            console.warn("未找到综合坐标转换面板，跳过初始化");
            return;
        }
        this.bindEvents();
        this.setupAccuracyControls();
        this.setupImportFileInputs();
        this.loadMetadata()
            .then(() => {
                this.populateEllipsoidSelects();
                this.applyDefaultSystems();
            })
            .catch((error) => {
                console.error("加载参考数据失败:", error);
                this.showMessage(`加载参考数据失败：${error.message}`, "error");
                this.applyDefaultSystems();
            })
            .finally(() => {
                this.ensureInitialRows();
                this.resetAccuracyPanel();
            });
    }

    cacheElements() {
        const scope = document.getElementById("coordinate-universal-content");
        this.elements.wrapper = scope;
        if (!scope) {
            return;
        }
        this.elements.commonBody = scope.querySelector("#common-points-table tbody");
        this.elements.pointsBody = scope.querySelector("#points-table tbody");
        this.elements.resultsBody = scope.querySelector("#results-table tbody");
        this.elements.messagesList = scope.querySelector("#universal-messages");
        this.elements.sevenInputs = Array.from(scope.querySelectorAll("#seven-parameter-grid .parameter-input"));
        this.elements.fourInputs = Array.from(scope.querySelectorAll("#four-parameter-grid .parameter-input"));
        this.elements.sevenMeta = scope.querySelector("#seven-parameter-meta");
        this.elements.fourMeta = scope.querySelector("#four-parameter-meta");
        this.elements.sourceForm = scope.querySelector("#source-system-form");
        this.elements.targetForm = scope.querySelector("#target-system-form");
        this.elements.ellipsoidSelects = Array.from(scope.querySelectorAll(".ellipsoid-select"));
        this.elements.importModal = document.getElementById("universalImportModal");
        this.elements.importTarget = document.getElementById("universal-import-target");
        this.elements.importTextarea = document.getElementById("universal-import-raw");
        // 字段映射相关元素
        this.elements.fieldMappingModal = document.getElementById("fieldMappingModal");
        this.elements.dataPreview = document.getElementById("data-preview");
        this.elements.fieldMappingContainer = document.getElementById("field-mapping-container");
        this.elements.fieldMappingConfirmBtn = document.getElementById("field-mapping-confirm");
        this.elements.exportModal = document.getElementById("coordinateExportModal");
        this.elements.exportTitle = document.getElementById("coordinate-export-title");
        this.elements.exportFormatContainer = document.getElementById("coordinate-export-format");
        this.elements.exportOptionsSection = document.getElementById("coordinate-export-options-section");
        this.elements.exportOptionsContainer = document.getElementById("coordinate-export-options");
        this.elements.exportFilename = document.getElementById("coordinate-export-filename");
        this.elements.exportDecimals = document.getElementById("coordinate-export-decimals");
        this.elements.exportIncludeHeader = document.getElementById("coordinate-export-include-header");
        this.elements.exportIncludeTimestamp = document.getElementById("coordinate-export-include-timestamp");
        this.elements.exportConfirmBtn = document.getElementById("coordinate-export-confirm");
        this.elements.exportDecimalRow = document.getElementById("coordinate-export-decimal-row");
        this.elements.exportDecimalGroupsRow = document.getElementById("coordinate-export-decimal-groups");
        this.elements.exportDecimalGrid = document.getElementById("coordinate-export-decimal-grid");
        this.elements.exportDecimalHint = document.getElementById("coordinate-export-decimal-hint");
        this.elements.exportDecimalsRow = this.elements.exportDecimals ? this.elements.exportDecimals.closest(".param-row") : this.elements.exportDecimalRow || null;
        this.elements.exportHeaderToggle = this.elements.exportIncludeHeader ? this.elements.exportIncludeHeader.closest(".inline-label") : null;
        this.elements.accuracyWrapper = scope.querySelector("#accuracy-content");
        this.elements.accuracyPlaceholder = scope.querySelector("#accuracy-placeholder");
        this.elements.sevenAccuracySummary = scope.querySelector("#seven-accuracy-summary");
        this.elements.fourAccuracySummary = scope.querySelector("#four-accuracy-summary");
        this.elements.sevenAccuracyTableBody = scope.querySelector("#seven-accuracy-table tbody");
        this.elements.fourAccuracyTableBody = scope.querySelector("#four-accuracy-table tbody");
        this.elements.sevenAccuracyMeta = scope.querySelector("#seven-accuracy-meta");
        this.elements.fourAccuracyMeta = scope.querySelector("#four-accuracy-meta");
        this.elements.accuracyStack = scope.querySelector("#accuracy-stack");
        this.elements.accuracySlider = scope.querySelector("#accuracy-split-slider");
        this.elements.accuracySplitDisplay = scope.querySelector("#accuracy-split-display");
        this.elements.accuracyPanes = Array.from(scope.querySelectorAll(".accuracy-pane"));
    }
    bindEvents() {
        const handlers = {
            "common-add-row": () => this.addCommonRow(),
            "points-add-row": () => this.addPointRow(),
            "universal-clear-common": () => this.clearCommonPoints(),
            "universal-clear-points": () => this.clearPoints(),
            "common-import-btn": () => this.openImportModal("common"),
            "points-import-btn": () => this.openImportModal("points"),
            "results-import-btn": () => this.openImportModal("results"),
            "common-export-btn": () => this.exportCommon(),
            "points-export-btn": () => this.exportPoints(),
            "results-export-btn": () => this.exportResults(),
            "universal-export-report": () => this.initiateReportExport(),
            "universal-clear-all": () => this.clearAllTables(),
            "universal-import-confirm": () => this.handleImport(),
            "field-mapping-confirm": () => this.handleFieldMappingConfirm(),
            "coordinate-export-confirm": () => this.confirmExport(),
            "cancelFieldMapping": () => this.closeFieldMappingModal(),
            "universal-compute-all": () => this.runComprehensiveCompute(),
        };
        Object.entries(handlers).forEach(([id, handler]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener("click", (event) => {
                    event.preventDefault();
                    handler();
                });
            }
        });

        const sevenToggle = document.getElementById("seven-manual-toggle");
        if (sevenToggle) {
            sevenToggle.addEventListener("change", (event) => {
                this.applyManualToggle("seven", event.target.checked);
            });
        }
        const fourToggle = document.getElementById("four-manual-toggle");
        if (fourToggle) {
            fourToggle.addEventListener("change", (event) => {
                this.applyManualToggle("four", event.target.checked);
            });
        }

        document.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                const modalId = btn.dataset.closeModal;
                if (modalId) {
                    this.closeModal(modalId);
                }
            });
        });

        const forms = [this.elements.sourceForm, this.elements.targetForm];
        forms.forEach((form) => {
            if (!form) return;
            form.querySelectorAll("input, select").forEach((input) => {
                if (input.type === "number") {
                    input.dataset.auto = "true";
                }
                input.addEventListener("input", () => {
                    input.dataset.auto = "false";
                });
            });
        });

        this.elements.ellipsoidSelects.forEach((select) => {
            select.addEventListener("change", (event) => this.onEllipsoidChange(event));
        });
    }


    setupAccuracyControls() {
        this.setupAccuracySplitter();
    }

    setupAccuracySplitter() {
        const slider = this.elements.accuracySlider;
        const stack = this.elements.accuracyStack;
        if (!slider || !stack) return;
        const panes = this.elements.accuracyPanes || [];
        const apply = (value) => this.applyAccuracySplit(value);
        slider.addEventListener('input', (event) => apply(Number(event.target.value)));
        slider.addEventListener('change', (event) => apply(Number(event.target.value)));
        apply(Number(slider.value) || 50);
    }

    applyAccuracySplit(value) {
        const slider = this.elements.accuracySlider;
        const panes = this.elements.accuracyPanes || [];
        if (!panes.length) return;
        const topPane = panes[0];
        const bottomPane = panes[1] || panes[0];
        const numericValue = Number(value);
        const normalized = Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 20), 80) : 50;
        if (slider && slider.value !== String(normalized)) {
            slider.value = String(normalized);
        }
        if (topPane) {
            topPane.style.flexGrow = normalized;
            topPane.style.flexBasis = '0%';
        }
        if (bottomPane) {
            const remain = 100 - normalized;
            bottomPane.style.flexGrow = remain;
            bottomPane.style.flexBasis = '0%';
        }
        if (this.elements.accuracySplitDisplay) {
            this.elements.accuracySplitDisplay.textContent = `${normalized}% / ${100 - normalized}%`;
        }
    }

    toggleAccuracyControls(enabled) {
        if (this.elements.accuracySlider) {
            this.elements.accuracySlider.disabled = !enabled;
        }
        if (this.elements.accuracyWrapper) {
            this.elements.accuracyWrapper.classList.toggle('has-data', Boolean(enabled));
        }
        if (this.elements.accuracyStack) {
            this.elements.accuracyStack.classList.toggle('is-active', Boolean(enabled));
        }
        const sliderValue = Number(this.elements.accuracySlider?.value) || 50;
        this.applyAccuracySplit(sliderValue);
        if (this.elements.accuracySplitDisplay) {
            this.elements.accuracySplitDisplay.style.visibility = enabled ? '' : 'hidden';
        }
    }

    setupImportFileInputs() {
        if (!document.body) {
            return;
        }
        ["common", "points", "results"].forEach((target) => {
            if (this.importFileInputs[target]) {
                return;
            }
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".txt,.csv,.dat";
            input.style.display = "none";
            input.addEventListener("change", (event) => this.handleFileInputChange(event, target));
            document.body.appendChild(input);
            this.importFileInputs[target] = input;
        });
    }

    triggerFileImport(target) {
        const input = this.importFileInputs[target];
        if (!input) {
            this.showMessage("暂不支持该类型的文件导入。", "error");
            return;
        }
        input.value = "";
        input.click();
    }

    handleFileInputChange(event, target) {
        const input = event?.target;
        const files = input?.files;
        const file = files && files.length ? files[0] : null;
        if (!file) {
            if (input) input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const content = typeof reader.result === "string" ? reader.result : "";
            
            // 对于表格类型的数据，强制触发字段映射流程
            if (["common", "points", "results"].includes(target)) {
                this.openFieldMappingModal(content, target);
            } else {
                // 非表格类型数据，直接导入
                const result = this.importFromRaw(content, target);
                if (result.success) {
                    const label = UNIVERSAL_IMPORT_LABELS[target] || "数据";
                    const fileName = file.name || "文件";
                    const countText = typeof result.count === "number" && result.count > 0 ? `（${result.count} 条）` : "";
                    this.showMessage(`已从文件 ${fileName} 导入${label}${countText}。`, "success");
                } else if (result.code === "empty") {
                    this.showMessage("所选文件为空，无法导入。", "warning");
                } else {
                    const errorMessage = result.error?.message || "未知错误";
                    this.showMessage(`导入失败：${errorMessage}`, "error");
                }
            }
            
            if (input) input.value = "";
        };
        reader.onerror = () => {
            console.error("文件读取失败:", reader.error);
            const errorMessage = reader.error?.message || file.name || "未知文件";
            this.showMessage(`读取文件失败：${errorMessage}`, "error");
            if (input) input.value = "";
        };
        try {
            reader.readAsText(file, "utf-8");
        } catch (error) {
            console.error("无法读取文件:", error);
            this.showMessage(`无法读取文件：${error.message}`, "error");
            if (input) input.value = "";
        }
    }

    async loadMetadata() {
        const response = await fetch(`${this.apiUrl}/metadata`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        if (!json.success) {
            throw new Error(json.error || "未知错误");
        }
        this.metadata = json.data || { ellipsoids: [] };
    }

    populateEllipsoidSelects() {
        const ellipsoids = this.metadata.ellipsoids || [];
        this.elements.ellipsoidSelects.forEach((select) => {
            if (!select) return;
            const currentValue = select.value;
            select.innerHTML = "";
            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "请选择椭球";
            placeholder.disabled = true;
            select.appendChild(placeholder);
            ellipsoids.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
            const customOption = document.createElement("option");
            customOption.value = "__custom__";
            customOption.textContent = "自定义椭球";
            select.appendChild(customOption);
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            } else if (ellipsoids.length) {
                select.value = ellipsoids[0].name;
            } else {
                select.value = "__custom__";
            }
        });
    }

    applyDefaultSystems() {
        const defaults = (name) => ({
            name,
            ellipsoid: { name: "CGCS2000" },
            projection: {
                central_meridian: null,
                zone_width: 3,
                false_easting: 500000,
                false_northing: 0,
                scale_factor: 1,
                projection_height: 0,
            },
            geoid: { undulation: 0 },
        });
        this.applySystemConfig(this.elements.sourceForm, defaults("原始坐标系"));
        this.applySystemConfig(this.elements.targetForm, defaults("目标坐标系"));
    }

    onEllipsoidChange(event) {
        const select = event.target;
        const form = select.closest(".system-form");
        if (!form) return;
        if (select.value === "__custom__" || !select.value) {
            this.unlockEllipsoidInputs(form);
            return;
        }
        const record = (this.metadata.ellipsoids || []).find((item) => item.name === select.value);
        if (!record) {
            this.unlockEllipsoidInputs(form);
            return;
        }
        this.applyEllipsoidRecord(form, record, { lock: true });
    }

    applyEllipsoidRecord(form, record, options = {}) {
        const lock = Boolean(options.lock);
        const aInput = form.querySelector('[data-target="ellipsoid.a"]');
        if (aInput) {
            aInput.value = record.a ?? "";
            aInput.dataset.auto = "true";
            aInput.readOnly = lock;
            aInput.classList.toggle("locked-input", lock);
        }
        const invInput = form.querySelector('[data-target="ellipsoid.inverse_flattening"]');
        if (invInput) {
            const inv = record.f_inverse ?? (record.f ? 1 / record.f : "");
            invInput.value = inv ?? "";
            invInput.dataset.auto = "true";
            invInput.readOnly = lock;
            invInput.classList.toggle("locked-input", lock);
        }
    }

    unlockEllipsoidInputs(form) {
        const inputs = form.querySelectorAll('[data-target="ellipsoid.a"], [data-target="ellipsoid.inverse_flattening"]');
        inputs.forEach((input) => {
            input.readOnly = false;
            input.classList.remove("locked-input");
            input.dataset.auto = "false";
        });
    }


    resetAccuracyPanel() {
        if (this.elements.sevenAccuracySummary) this.elements.sevenAccuracySummary.innerHTML = "";
        if (this.elements.fourAccuracySummary) this.elements.fourAccuracySummary.innerHTML = "";
        if (this.elements.sevenAccuracyTableBody) this.elements.sevenAccuracyTableBody.innerHTML = "";
        if (this.elements.fourAccuracyTableBody) this.elements.fourAccuracyTableBody.innerHTML = "";
        if (this.elements.sevenAccuracyMeta) this.elements.sevenAccuracyMeta.textContent = "";
        if (this.elements.fourAccuracyMeta) this.elements.fourAccuracyMeta.textContent = "";
        if (this.elements.accuracyPlaceholder) this.elements.accuracyPlaceholder.style.display = "";
        if (typeof this.toggleAccuracyControls === 'function') {
            this.toggleAccuracyControls(false);
        }
    }

    buildAccuracySummary() {
        const summary = {};
        if (this.latestSevenParameters) {
            const seven = this.latestSevenParameters;
            const residuals = Array.isArray(seven.residuals) ? seven.residuals : [];
            const processed = residuals.map((item) => {
                const vx = Number(item.vx) || 0;
                const vy = Number(item.vy) || 0;
                const vz = Number(item.vz) || 0;
                return {
                    name: item.name || "",
                    vx,
                    vy,
                    vz,
                    magnitude: Math.sqrt(vx * vx + vy * vy + vz * vz),
                };
            });
            const rmse = seven.rmse || {};
            const count = processed.length;
            const maxMagnitude = count ? Math.max(...processed.map((item) => item.magnitude)) : null;
            const maxComponent = count ? Math.max(...processed.map((item) => Math.max(Math.abs(item.vx), Math.abs(item.vy), Math.abs(item.vz)))) : null;
            const avgMagnitude = count ? processed.reduce((sum, item) => sum + item.magnitude, 0) / count : null;
            summary.seven = {
                rmse,
                residuals: processed,
                count,
                maxMagnitude,
                maxComponent,
                avgMagnitude,
            };
        } else {
            summary.seven = null;
        }
        if (this.latestFourParameters) {
            const four = this.latestFourParameters;
            const residuals = Array.isArray(four.residuals) ? four.residuals : [];
            const processed = residuals.map((item) => {
                const vx = Number(item.vx) || 0;
                const vy = Number(item.vy) || 0;
                return {
                    name: item.name || "",
                    vx,
                    vy,
                    magnitude: Math.sqrt(vx * vx + vy * vy),
                };
            });
            const rmse = four.rmse || {};
            const count = processed.length;
            const maxMagnitude = count ? Math.max(...processed.map((item) => item.magnitude)) : null;
            const maxComponent = count ? Math.max(...processed.map((item) => Math.max(Math.abs(item.vx), Math.abs(item.vy)))) : null;
            const avgMagnitude = count ? processed.reduce((sum, item) => sum + item.magnitude, 0) / count : null;
            summary.four = {
                rmse,
                residuals: processed,
                count,
                maxMagnitude,
                maxComponent,
                avgMagnitude,
            };
        } else {
            summary.four = null;
        }
        if (!summary.seven && !summary.four) {
            return null;
        }
        return summary;
    }

    refreshAccuracyPanel() {
        const summary = this.buildAccuracySummary();
        this.latestAccuracy = summary;
        if (!summary) {
            this.resetAccuracyPanel();
            return;
        }
        this.renderAccuracyPanel(summary);
    }

    renderAccuracyPanel(summary) {
        if (!this.elements.accuracyWrapper) return;
        if (this.elements.accuracyPlaceholder) {
            this.elements.accuracyPlaceholder.style.display = "none";
        }
        if (typeof this.toggleAccuracyControls === 'function') {
            this.toggleAccuracyControls(true);
        } else {
            this.elements.accuracyWrapper.classList.add('has-data');
        }
        if (summary.seven) {
            const sevenRmse = summary.seven.rmse || {};
            this.renderAccuracySummary(this.elements.sevenAccuracySummary, [
                { label: "RMSE X", value: this.formatNumber(sevenRmse.x, 4) },
                { label: "RMSE Y", value: this.formatNumber(sevenRmse.y, 4) },
                { label: "RMSE Z", value: this.formatNumber(sevenRmse.z, 4) },
                { label: "最大残差", value: this.formatNumber(summary.seven.maxMagnitude, 4) },
                { label: "观测数", value: summary.seven.count }
            ]);
            if (this.elements.sevenAccuracyMeta) {
                this.elements.sevenAccuracyMeta.textContent = `残差平均值：${this.formatNumber(summary.seven.avgMagnitude, 4) || '-'}`;
            }
            this.renderAccuracyTable(this.elements.sevenAccuracyTableBody, summary.seven.residuals, ["vx", "vy", "vz"]);
        } else {
            if (this.elements.sevenAccuracySummary) this.elements.sevenAccuracySummary.innerHTML = "暂无数据";
            if (this.elements.sevenAccuracyTableBody) this.elements.sevenAccuracyTableBody.innerHTML = "";
            if (this.elements.sevenAccuracyMeta) this.elements.sevenAccuracyMeta.textContent = "";
        }
        if (summary.four) {
            const fourRmse = summary.four.rmse || {};
            this.renderAccuracySummary(this.elements.fourAccuracySummary, [
                { label: "RMSE X", value: this.formatNumber(fourRmse.x, 4) },
                { label: "RMSE Y", value: this.formatNumber(fourRmse.y, 4) },
                { label: "最大残差", value: this.formatNumber(summary.four.maxMagnitude, 4) },
                { label: "观测数", value: summary.four.count }
            ]);
            if (this.elements.fourAccuracyMeta) {
                this.elements.fourAccuracyMeta.textContent = `残差平均值：${this.formatNumber(summary.four.avgMagnitude, 4) || '-'}`;
            }
            this.renderAccuracyTable(this.elements.fourAccuracyTableBody, summary.four.residuals, ["vx", "vy"]);
        } else {
            if (this.elements.fourAccuracySummary) this.elements.fourAccuracySummary.innerHTML = "暂无数据";
            if (this.elements.fourAccuracyTableBody) this.elements.fourAccuracyTableBody.innerHTML = "";
            if (this.elements.fourAccuracyMeta) this.elements.fourAccuracyMeta.textContent = "";
        }
    }

    renderAccuracySummary(container, metrics) {
        if (!container) return;
        const content = (metrics || []).map((item) => `
            <div class="accuracy-metric">
                <span class="metric-label">${item.label}</span>
                <span class="metric-value">${item.value === undefined || item.value === null || item.value === '' ? '-' : item.value}</span>
            </div>
        `).join("");
        container.innerHTML = content || '<span class="metric-empty">暂无数据</span>';
    }

    renderAccuracyTable(tbody, rows, columns) {
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!rows || !rows.length) return;
        rows.forEach((row) => {
            const tr = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.textContent = row.name || "-";
            tr.appendChild(nameCell);
            columns.forEach((col) => {
                const td = document.createElement("td");
                td.textContent = this.formatNumber(row[col], 4) || "-";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    }

    applySystemConfig(form, config = {}) {
        if (!form) return;
        form.querySelectorAll("input, select").forEach((el) => {
            const target = el.dataset.target;
            if (!target) return;
            const segments = target.split(".");
            let cursor = config;
            segments.forEach((key) => {
                if (cursor) cursor = cursor[key];
            });
            if (cursor === undefined || cursor === null) {
                el.value = "";
            } else {
                el.value = cursor;
            }
            if (el.type === "number") {
                el.dataset.auto = "true";
            }
        });
        const ellipsoidSelect = form.querySelector(".ellipsoid-select");
        const ellipsoidName = config.ellipsoid && config.ellipsoid.name;
        if (ellipsoidSelect) {
            if (ellipsoidName && ellipsoidSelect.querySelector('option[value="' + ellipsoidName + '"]')) {
                ellipsoidSelect.value = ellipsoidName;
                if (ellipsoidName === "__custom__") {
                    this.unlockEllipsoidInputs(form);
                } else {
                    const record = (this.metadata.ellipsoids || []).find((item) => item.name === ellipsoidName);
                    if (record) {
                        this.applyEllipsoidRecord(form, record, { lock: true });
                    } else {
                        ellipsoidSelect.value = "__custom__";
                        this.unlockEllipsoidInputs(form);
                    }
                }
            } else {
                ellipsoidSelect.value = "__custom__";
                this.unlockEllipsoidInputs(form);
            }
        }
    }
    ensureInitialRows() {
        if (this.elements.commonBody && !this.elements.commonBody.children.length) {
            this.addCommonRow({});
        }
        if (this.elements.pointsBody && !this.elements.pointsBody.children.length) {
            this.addPointRow({});
        }
    }

    clearCommonPoints() {
        if (!this.elements.commonBody) return;
        this.elements.commonBody.innerHTML = "";
        // 清空后添加一个空行
        this.addCommonRow({});
    }

    clearPoints() {
        if (!this.elements.pointsBody) return;
        this.elements.pointsBody.innerHTML = "";
        // 清空后添加一个空行
        this.addPointRow({});
    }

    clearResults() {
        if (this.elements.resultsBody) {
            this.elements.resultsBody.innerHTML = "";
        }
        this.lastResults = [];
        this.latestAccuracy = null;
        this.resetAccuracyPanel();
    }

    clearAllTables() {
        this.clearCommonPoints();
        this.clearPoints();
        this.clearResults();
        if (typeof this.resetAccuracyPanel === "function") {
            this.resetAccuracyPanel();
        }
        this.showMessage("已清空全部表格。", "info");
    }


    collectCommonPoints() {
        if (!this.elements.commonBody) return [];
        return Array.from(this.elements.commonBody.querySelectorAll("tr"))
            .map((row) => {
                const point = { name: "", source: {}, target: {} };
                row.querySelectorAll("input").forEach((input) => {
                    const section = input.dataset.section;
                    const field = input.dataset.field;
                    const value = input.value.trim();
                    if (section === "name") {
                        point.name = value;
                    } else if (section === "source") {
                        point.source[field] = value || null;
                    } else if (section === "target") {
                        point.target[field] = value || null;
                    }
                });
                return point;
            })
            .filter((item) => {
                const hasSource = Object.values(item.source).some((val) => val);
                const hasTarget = Object.values(item.target).some((val) => val);
                return item.name || hasSource || hasTarget;
            });
    }

    collectPoints(includeEmpty = false) {
        if (!this.elements.pointsBody) return [];
        return Array.from(this.elements.pointsBody.querySelectorAll("tr"))
            .map((row) => {
                const point = {};
                row.querySelectorAll("input").forEach((input) => {
                    const field = input.dataset.field;
                    const value = input.value.trim();
                    point[field] = value || null;
                });
                return point;
            })
            .filter((point) => {
                if (includeEmpty) return true;
                return Object.values(point).some((val) => val);
            });
    }

    collectSevenParameters() {
        const data = { mode: this.manualModes.seven ? "manual" : "auto" };
        this.elements.sevenInputs.forEach((input) => {
            const key = input.dataset.field;
            const value = input.value.trim();
            data[key] = value ? Number(value) : null;
        });
        data.rx = this.convertArcsecToRadians(data.rx_arcsec);
        data.ry = this.convertArcsecToRadians(data.ry_arcsec);
        data.rz = this.convertArcsecToRadians(data.rz_arcsec);
        data.scale = data.scale_ppm !== null && data.scale_ppm !== undefined ? data.scale_ppm * 1e-6 : null;
        return data;
    }

    collectFourParameters() {
        const data = { mode: this.manualModes.four ? "manual" : "auto" };
        this.elements.fourInputs.forEach((input) => {
            const key = input.dataset.field;
            const value = input.value.trim();
            data[key] = value ? Number(value) : null;
        });
        data.rotation = this.convertArcsecToRadians(data.rotation_arcsec);
        data.scale = data.scale_ppm !== null && data.scale_ppm !== undefined ? data.scale_ppm * 1e-6 : null;
        return data;
    }

    convertArcsecToRadians(value) {
        if (value === null || value === undefined || value === "") return null;
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return null;
        return (numeric / 3600) * (Math.PI / 180);
    }

    collectSystemConfig(form) {
        const result = {};
        if (!form) return result;
        form.querySelectorAll("[data-target]").forEach((input) => {
            const path = input.dataset.target;
            const segments = path.split(".");
            let cursor = result;
            segments.slice(0, -1).forEach((segment) => {
                if (!cursor[segment]) cursor[segment] = {};
                cursor = cursor[segment];
            });
            const key = segments[segments.length - 1];
            if (input.tagName === "SELECT") {
                cursor[key] = input.value || null;
            } else if (input.type === "number") {
                const numeric = Number(input.value);
                cursor[key] = Number.isNaN(numeric) ? null : numeric;
            } else {
                cursor[key] = input.value.trim() || null;
            }
        });
        return result;
    }
    async runComprehensiveCompute() {
        const computeBtn = document.getElementById("universal-compute-all");
        if (computeBtn && computeBtn.dataset.loading === "true") {
            return;
        }
        const commonPoints = this.collectCommonPoints();
        const transformationPoints = this.collectPoints(false);
        if (!commonPoints.length) {
            this.showMessage("请先录入至少一个公共点。", "warning");
            return;
        }
        if (!this.manualModes.seven && transformationPoints.length && commonPoints.length < 3) {
            this.showMessage("自动计算七参数至少需要 3 个公共点。", "warning");
            return;
        }
        let originalHtml = "";
        if (computeBtn) {
            originalHtml = computeBtn.innerHTML;
            computeBtn.dataset.loading = "true";
            computeBtn.disabled = true;
            computeBtn.classList.add("loading");
            computeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 计算中...';
        }
        try {
            const payload = this.buildPayload({ commonPoints, points: transformationPoints });
            await this.process({ payload, silent: false });
        } finally {
            if (computeBtn) {
                computeBtn.disabled = false;
                computeBtn.classList.remove("loading");
                computeBtn.innerHTML = originalHtml;
                computeBtn.removeAttribute("data-loading");
            }
        }
    }

    buildPayload({ commonPoints = null, points = null } = {}) {
        const preparedCommon = commonPoints ?? this.collectCommonPoints();
        const preparedPoints = points ?? this.collectPoints(false);
        return {
            source_system: this.collectSystemConfig(this.elements.sourceForm),
            target_system: this.collectSystemConfig(this.elements.targetForm),
            common_points: preparedCommon,
            points: preparedPoints,
            parameters: {
                seven: this.collectSevenParameters(),
                four: this.collectFourParameters(),
            },
            options: {
                auto_fill: true,
                auto_parameters: !(this.manualModes.seven && this.manualModes.four),
            },
        };
    }

    async process({ payload = null, silent = false } = {}) {
        try {
            const preparedPayload = payload ?? this.buildPayload();
            const hasPoints = Array.isArray(preparedPayload.points) && preparedPayload.points.length > 0;
            const response = await fetch(`${this.apiUrl}/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(preparedPayload),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const json = await response.json();
            if (!json.success) {
                throw new Error(json.error || "处理失败");
            }
            this.applyResponse(json.data || {}, json.messages || []);
            if (!silent) {
                const message = hasPoints ? "转换完成，结果已更新。" : "公共点校核完成。";
                this.showMessage(message, "success");
            }
        } catch (error) {
            console.error("综合坐标转换失败:", error);
            this.showMessage(`转换失败：${error.message}`, "error");
        }
    }

    applyResponse(data, messages) {
        if (data.source_system) {
            this.applySystemConfig(this.elements.sourceForm, data.source_system);
        }
        if (data.target_system) {
            this.applySystemConfig(this.elements.targetForm, data.target_system);
        }
        if (data.common_points) this.populateCommonPoints(data.common_points);
        if (data.points) this.populatePoints(data.points);
        if (data.seven_parameters) this.updateSevenParameters(data.seven_parameters);
        if (data.four_parameters) this.updateFourParameters(data.four_parameters);
        if (Array.isArray(data.results)) {
            this.populateResults(data.results);
        }
        this.refreshAccuracyPanel();
        this.showMessages(messages || []);
    }

    populateCommonPoints(rows) {
        if (!this.elements.commonBody) return;
        // 清空表格
        this.elements.commonBody.innerHTML = "";
        
        // 如果没有数据，添加一个空行
        if (!rows || !rows.length) {
            this.addCommonRow({});
            return;
        }
        
        // 填充数据
        rows.forEach((row) => this.addCommonRow(row));
    }

    populatePoints(rows) {
        if (!this.elements.pointsBody) return;
        // 清空表格
        this.elements.pointsBody.innerHTML = "";
        
        // 如果没有数据，添加一个空行
        if (!rows || !rows.length) {
            this.addPointRow({});
            return;
        }
        
        // 填充数据
        rows.forEach((row) => this.addPointRow(row));
    }

    updateSevenParameters(data) {
        this.latestSevenParameters = data || null;
        const rotation = data.rotation_arcsec || {};
        const map = {
            dx: data.dx,
            dy: data.dy,
            dz: data.dz,
            rx_arcsec: rotation.rx,
            ry_arcsec: rotation.ry,
            rz_arcsec: rotation.rz,
            scale_ppm: data.scale_ppm,
        };
        this.elements.sevenInputs.forEach((input) => {
            const key = input.dataset.field;
            if (!Object.prototype.hasOwnProperty.call(map, key)) return;
            const value = map[key];
            input.value = value === null || value === undefined ? "" : Number(value).toFixed(6);
            if (!this.manualModes.seven) {
                input.readOnly = true;
                input.classList.remove("manual");
            }
        });
        if (this.elements.sevenMeta) {
            const rmse = data.rmse || {};
            const rmseText = ["x", "y", "z"]
                .map((axis) => (rmse[axis] !== undefined ? `${axis.toUpperCase()}=${Number(rmse[axis]).toFixed(4)}m` : null))
                .filter(Boolean)
                .join("，");
            this.elements.sevenMeta.textContent = `来源：${data.source || "自动计算"}；观测数：${data.observations || 0}；RMSE：${rmseText}`;
        }
    }

    updateFourParameters(data) {
        this.latestFourParameters = data || null;
        const map = {
            dx: data.dx,
            dy: data.dy,
            rotation_arcsec: data.rotation_arcsec,
            scale_ppm: data.scale_ppm,
        };
        this.elements.fourInputs.forEach((input) => {
            const key = input.dataset.field;
            if (!Object.prototype.hasOwnProperty.call(map, key)) return;
            const value = map[key];
            input.value = value === null || value === undefined ? "" : Number(value).toFixed(6);
            if (!this.manualModes.four) {
                input.readOnly = true;
                input.classList.remove("manual");
            }
        });
        if (this.elements.fourMeta) {
            const rmse = data.rmse || {};
            const rmseText = ["x", "y"]
                .map((axis) => (rmse[axis] !== undefined ? `${axis.toUpperCase()}=${Number(rmse[axis]).toFixed(4)}m` : null))
                .filter(Boolean)
                .join("，");
            this.elements.fourMeta.textContent = `来源：${data.source || "自动计算"}；观测数：${data.observations || 0}；RMSE：${rmseText}`;
        }
    }
    populateResults(results) {
        if (!this.elements.resultsBody) return;
        this.elements.resultsBody.innerHTML = "";
        this.lastResults = Array.isArray(results) ? results : [];
        this.lastResults.forEach((item) => {
            const target = item.target || {};
            const tr = document.createElement("tr");
            if (item.error) tr.classList.add("error-row");
            const cells = [
                item.name || "",
                target.B !== undefined ? Number(target.B).toFixed(8) : "",
                target.L !== undefined ? Number(target.L).toFixed(8) : "",
                target.H !== undefined ? Number(target.H).toFixed(3) : "",
                target.X !== undefined ? Number(target.X).toFixed(3) : "",
                target.Y !== undefined ? Number(target.Y).toFixed(3) : "",
                target.Z !== undefined ? Number(target.Z).toFixed(3) : "",
                target.x !== undefined ? Number(target.x).toFixed(3) : "",
                target.y !== undefined ? Number(target.y).toFixed(3) : "",
                target.h !== undefined ? Number(target.h).toFixed(3) : "",
                item.error || "",
            ];
            cells.forEach((text) => {
                const td = document.createElement("td");
                td.textContent = text;
                tr.appendChild(td);
            });
            this.elements.resultsBody.appendChild(tr);
        });
    }

    showMessages(messages) {
        if (!this.elements.messagesList) return;
        this.elements.messagesList.innerHTML = "";
        messages.forEach((message) => {
            const li = document.createElement("li");
            li.textContent = message;
            this.elements.messagesList.appendChild(li);
        });
    }

    applyManualToggle(type, enabled) {
        this.manualModes[type] = enabled;
        const inputs = type === "seven" ? this.elements.sevenInputs : this.elements.fourInputs;
        inputs.forEach((input) => {
            input.readOnly = !enabled;
            input.classList.toggle("manual", enabled);
        });
        const meta = type === "seven" ? this.elements.sevenMeta : this.elements.fourMeta;
        if (meta && enabled) meta.textContent = "当前为手动模式，请直接编辑参数取值。";
    }

    openImportModal(target) {
        // 直接调用文件导入功能，不显示模态框
        if (["common", "points", "results"].includes(target)) {
            this.triggerFileImport(target);
            return;
        }
        
        // 对于其他类型的导入，仍然使用模态框
        const modal = this.elements.importModal;
        if (!modal) {
            this.showMessage("未找到导入窗口。", "error");
            return;
        }
        modal.style.display = "block";
        modal.classList.add("show");
        this.currentImportTarget = target || null;
        const select = this.elements.importTarget;
        if (select) {
            if (target) {
                select.value = target;
                select.disabled = true;
            } else {
                select.disabled = false;
            }
        }
        const textarea = this.elements.importTextarea;
        if (textarea) {
            textarea.value = "";
            textarea.placeholder = this.getImportPlaceholder(target || (select ? select.value : "common"));
        }
        const title = document.getElementById("importModalTitle");
        if (title) {
            const label = target ? (UNIVERSAL_IMPORT_LABELS[target] || "数据") : "数据";
            title.textContent = target ? `导入${label}` : "导入数据";
        }
    }

    closeModal(modalId) {
        if (!modalId) return;
        if (modalId === "universalImportModal") {
            this.closeImportModal();
            return;
        }
        if (modalId === "coordinateExportModal") {
            this.closeExportModal();
            return;
        }
        if (modalId === "fieldMappingModal") {
            this.closeFieldMappingModal();
            return;
        }
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove("show");
            modal.style.display = "none";
        }
    }

    closeImportModal() {
        const modal = this.elements.importModal;
        if (modal) {
            modal.classList.remove("show");
            modal.style.display = "none";
        }
        this.resetImportModal();
    }

    closeExportModal() {
        const modal = this.elements.exportModal;
        if (modal) {
            modal.classList.remove("show");
            modal.style.display = "none";
        }
        this.resetExportModal(true);
    }

    resetExportModal(clearContext = true) {
        if (clearContext) {
            this.exportContext = null;
        }
        if (this.elements.exportFilename) {
            this.elements.exportFilename.value = "";
        }
        if (this.elements.exportDecimals) {
            this.elements.exportDecimals.value = 3;
        }
        if (this.elements.exportIncludeHeader) {
            this.elements.exportIncludeHeader.checked = true;
        }
        if (this.elements.exportIncludeTimestamp) {
            this.elements.exportIncludeTimestamp.checked = true;
        }
        if (this.elements.exportOptionsContainer) {
            this.elements.exportOptionsContainer.innerHTML = "";
        }
        if (this.elements.exportOptionsSection) {
            this.elements.exportOptionsSection.style.display = "none";
        }
        if (this.elements.exportDecimalsRow) {
            this.elements.exportDecimalsRow.style.display = "";
        }
        if (this.elements.exportDecimalGroupsRow) {
            this.elements.exportDecimalGroupsRow.style.display = "none";
        }
        if (this.elements.exportDecimalGrid) {
            this.elements.exportDecimalGrid.innerHTML = "";
        }
        if (this.elements.exportDecimalHint) {
            this.elements.exportDecimalHint.style.display = "none";
        }
        if (this.elements.exportHeaderToggle) {
            this.elements.exportHeaderToggle.style.display = "";
        }
        if (this.elements.exportFormatContainer) {
            const defaultOption = this.elements.exportFormatContainer.querySelector("input[name=\"coordinateExportFormat\"]");
            if (defaultOption && !defaultOption.disabled) {
                defaultOption.checked = true;
            }
        }
    }

    resetImportModal() {
        this.currentImportTarget = null;
        const select = this.elements.importTarget;
        if (select) {
            select.disabled = false;
            if (select.options.length) {
                select.value = select.options[0].value;
            }
        }
        if (this.elements.importTextarea) {
            this.elements.importTextarea.value = "";
            this.elements.importTextarea.placeholder = this.getImportPlaceholder("common");
        }
        const title = document.getElementById("importModalTitle");
        if (title) {
            title.textContent = "导入数据";
        }
    }

    getImportPlaceholder(target) {
        switch (target) {
            case "common":
                return "点名,B,L,H,X,Y,Z,x,y,h,B,L,H,X,Y,Z,x,y,h";
            case "points":
                return "点名,B,L,H,X,Y,Z,x,y,h";
            case "results":
                return "点名,B,L,H,X,Y,Z,x,y,h,备注";
            case "seven":
                return "dx=,dy=,dz=,rx=,ry=,rz=,scale_ppm=";
            case "four":
                return "dx=,dy=,rotation_arcsec=,scale_ppm=";
            case "source_system":
            case "target_system":
                return "name=,ellipsoid.a=,ellipsoid.inverse_flattening=,projection.central_meridian=...";
            default:
                return "支持逗号/空格分隔或 key=value 形式的数据";
        }
    }

    importFromRaw(rawContent, target) {
        const resolvedTarget = target || "common";
        const text = typeof rawContent === "string" ? rawContent.replace(/^\uFEFF/, "").trim() : "";
        if (!text) {
            return { success: false, code: "empty" };
        }
        let count = null;
        try {
            switch (resolvedTarget) {
                case "common": {
                    const rows = this.parseCommonImport(text);
                    count = Array.isArray(rows) ? rows.length : 0;
                    
                    // 检查表格是否已有有效数据（非空行）
                    const hasExistingData = this.elements.commonBody && 
                        Array.from(this.elements.commonBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-section="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    
                    if (hasExistingData) {
                        // 合并数据
                        this.mergeCommonPoints(rows);
                    } else {
                        // 没有现有数据，直接填充
                        this.populateCommonPoints(rows);
                    }
                    break;
                }
                case "points": {
                    const rows = this.parsePointImport(text);
                    count = Array.isArray(rows) ? rows.length : 0;
                    
                    // 检查表格是否已有有效数据（非空行）
                    const hasExistingData = this.elements.pointsBody && 
                        Array.from(this.elements.pointsBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-field="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    
                    if (hasExistingData) {
                        // 合并数据
                        this.mergePoints(rows);
                    } else {
                        // 没有现有数据，直接填充
                        this.populatePoints(rows);
                    }
                    break;
                }
                case "results": {
                    const rows = this.parseResultsImport(text);
                    count = Array.isArray(rows) ? rows.length : 0;
                    
                    // 检查表格是否已有数据
                    const hasExistingData = this.elements.resultsBody && this.elements.resultsBody.children.length > 0;
                    
                    if (hasExistingData) {
                        // 合并数据
                        this.mergeResults(rows);
                    } else {
                        // 没有现有数据，直接填充
                        this.populateResults(rows);
                    }
                    break;
                }
                case "seven":
                    this.applySevenManualInput(this.parseKeyValueImport(text));
                    break;
                case "four":
                    this.applyFourManualInput(this.parseKeyValueImport(text));
                    break;
                case "source_system":
                    this.applySystemConfig(this.elements.sourceForm, this.parseSystemImport(text));
                    break;
                case "target_system":
                    this.applySystemConfig(this.elements.targetForm, this.parseSystemImport(text));
                    break;
                default:
                    throw new Error("暂不支持的导入类型。");
            }
            return { success: true, count };
        } catch (error) {
            console.error("导入失败:", error);
            return { success: false, code: "error", error };
        }
    }

    handleImport() {
        const select = this.elements.importTarget;
        const textarea = this.elements.importTextarea;
        if (!textarea) return;
        const target = this.currentImportTarget || (select ? select.value : "common");
        if (select && !this.currentImportTarget) {
            select.value = target;
        }
        const raw = textarea.value;
        
        // 对于表格类型的数据，强制触发字段映射流程
        if (["common", "points", "results"].includes(target)) {
            this.openFieldMappingModal(raw, target);
            return;
        }
        
        const result = this.importFromRaw(raw, target);
        if (result.success) {
            this.closeImportModal();
            const label = UNIVERSAL_IMPORT_LABELS[target] || "数据";
            const countText = typeof result.count === "number" && result.count > 0 ? `（${result.count} 条）` : "";
            
            // 检查表格是否已有数据，以显示不同的成功消息
            let hasExistingData = false;
            switch (target) {
                case "common":
                    hasExistingData = this.elements.commonBody && this.elements.commonBody.children.length > 0;
                    break;
                case "points":
                    hasExistingData = this.elements.pointsBody && this.elements.pointsBody.children.length > 0;
                    break;
                case "results":
                    hasExistingData = this.elements.resultsBody && this.elements.resultsBody.children.length > 0;
                    break;
            }
            
            if (hasExistingData) {
                this.showMessage(`${label}已合并，相同点号数据已更新，不同点号数据已追加${countText}。`, "success");
            } else {
                this.showMessage(`${label}导入完成，可继续计算${countText}。`, "success");
            }
        } else if (result.code === "empty") {
            this.showMessage("请粘贴需要导入的数据内容。", "warning");
        } else {
            const errorMessage = result.error?.message || "未知错误";
            this.showMessage(`导入失败：${errorMessage}`, "error");
        }
    }
    splitLine(line) {
        let parts = line.split(/[,;\t]+/).map((item) => item.trim()).filter(Boolean);
        if (parts.length <= 1) {
            parts = line.split(/\s+/).map((item) => item.trim()).filter(Boolean);
        }
        return parts;
    }

    parseCommonImport(raw) {
        const rows = [];
        raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const tokens = this.splitLine(line);
                if (!tokens.length) return;
                while (tokens.length < 19) tokens.push("");
                const [
                    name,
                    sB,
                    sL,
                    sH,
                    sX,
                    sY,
                    sZ,
                    sx,
                    sy,
                    sh,
                    tB,
                    tL,
                    tH,
                    tX,
                    tY,
                    tZ,
                    tx,
                    ty,
                    th,
                ] = tokens;
                rows.push({
                    name,
                    source: { B: sB, L: sL, H: sH, X: sX, Y: sY, Z: sZ, x: sx, y: sy, h: sh },
                    target: { B: tB, L: tL, H: tH, X: tX, Y: tY, Z: tZ, x: tx, y: ty, h: th },
                });
            });
        if (!rows.length) throw new Error("未识别到有效的公共点数据。");
        return rows;
    }

    parsePointImport(raw) {
        const rows = [];
        raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const tokens = this.splitLine(line);
                if (!tokens.length) return;
                while (tokens.length < 10) tokens.push("");
                const [name, B, L, H, X, Y, Z, x, y, h] = tokens;
                rows.push({ name, B, L, H, X, Y, Z, x, y, h });
            });
        if (!rows.length) throw new Error("未识别到有效的待转换点数据。");
        return rows;
    }

    parseResultsImport(raw) {
        const rows = [];
        const toNumber = (value) => {
            if (value === null || value === undefined || value === "") return null;
            const num = Number(value);
            return Number.isFinite(num) ? num : null;
        };
        raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const tokens = this.splitLine(line);
                if (!tokens.length) return;
                while (tokens.length < 11) tokens.push("");
                const [name, B, L, H, X, Y, Z, x, y, h, remark] = tokens;
                rows.push({
                    name,
                    target: {
                        B: toNumber(B),
                        L: toNumber(L),
                        H: toNumber(H),
                        X: toNumber(X),
                        Y: toNumber(Y),
                        Z: toNumber(Z),
                        x: toNumber(x),
                        y: toNumber(y),
                        h: toNumber(h),
                    },
                    error: remark || "",
                });
            });
        if (!rows.length) throw new Error("未识别到有效的转换结果数据。");
        return rows;
    }

    parseKeyValueImport(raw) {
        const result = {};
        raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .forEach((line) => {
                const tokens = line.split(/[:=,\s]+/).filter(Boolean);
                if (tokens.length >= 2) {
                    result[tokens[0].toLowerCase()] = tokens[1];
                }
            });
        return result;
    }

    parseSystemImport(raw) {
        const params = this.parseKeyValueImport(raw);
        const config = { ellipsoid: {}, projection: {}, geoid: {} };
        Object.entries(params).forEach(([key, value]) => {
            const lower = key.toLowerCase();
            const numeric = Number(value);
            if (lower.includes("name") && !lower.includes("projection")) {
                config.name = value;
            } else if (lower.includes("ellipsoid") && lower.includes("a")) {
                config.ellipsoid.a = numeric;
            } else if (lower.includes("ellipsoid") && lower.includes("flatten")) {
                config.ellipsoid.inverse_flattening = numeric;
            } else if (lower.includes("ellipsoid") && lower.includes("name")) {
                config.ellipsoid.name = value;
            } else if (lower.includes("central") || lower.includes("lon")) {
                config.projection.central_meridian = numeric;
            } else if (lower.includes("zone") || lower === "width") {
                config.projection.zone_width = numeric;
            } else if (lower.includes("false") && lower.includes("east")) {
                config.projection.false_easting = numeric;
            } else if (lower.includes("false") && lower.includes("north")) {
                config.projection.false_northing = numeric;
            } else if (lower.includes("scale")) {
                config.projection.scale_factor = numeric;
            } else if (lower.includes("height")) {
                config.projection.projection_height = numeric;
            } else if (lower.includes("undulation") || lower === "n") {
                config.geoid.undulation = numeric;
            }
        });
        return config;
    }

    applySevenManualInput(params) {
        const map = {
            dx: ["dx", "δx"],
            dy: ["dy", "δy"],
            dz: ["dz", "δz"],
            rx_arcsec: ["rx", "δx", "rotationx"],
            ry_arcsec: ["ry", "δy", "rotationy"],
            rz_arcsec: ["rz", "δz", "rotationz"],
            scale_ppm: ["scale", "ppm", "k"],
        };
        this.elements.sevenInputs.forEach((input) => {
            const key = input.dataset.field;
            const valueKey = map[key]?.find((alias) => params[alias]);
            if (valueKey) input.value = params[valueKey];
        });
        const toggle = document.getElementById("seven-manual-toggle");
        if (toggle) {
            toggle.checked = true;
            this.applyManualToggle("seven", true);
        }
    }

    applyFourManualInput(params) {
        const map = {
            dx: ["dx", "δx"],
            dy: ["dy", "δy"],
            rotation_arcsec: ["rotation", "theta", "angle"],
            scale_ppm: ["scale", "ppm", "k"],
        };
        this.elements.fourInputs.forEach((input) => {
            const key = input.dataset.field;
            const valueKey = map[key]?.find((alias) => params[alias]);
            if (valueKey) input.value = params[valueKey];
        });
        const toggle = document.getElementById("four-manual-toggle");
        if (toggle) {
            toggle.checked = true;
            this.applyManualToggle("four", true);
        }
    }

    formatDelimitedRow(values, separator) {
        return values
            .map((value) => {
                if (value === null || value === undefined) return "";
                const text = String(value);
                if (separator === "," && /[",\n]/.test(text)) {
                    return `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            })
            .join(separator);
    }

    openExportModal(context) {
        if (!this.elements.exportModal) {
            this.showMessage("未找到坐标导出模态框。", "error");
            return;
        }
        const modalContext = { ...context };
        this.resetExportModal(false);
        this.exportContext = modalContext;
        if (this.elements.exportTitle) {
            this.elements.exportTitle.textContent = modalContext.title || "导出设置";
        }
        const allowedFormats = Array.isArray(modalContext.allowedFormats) && modalContext.allowedFormats.length
            ? modalContext.allowedFormats
            : ["txt", "dat", "csv", "excel", "word"];
        this.configureExportFormats(allowedFormats, modalContext.preferredFormat || allowedFormats[0]);
        if (this.elements.exportFilename) {
            this.elements.exportFilename.value = modalContext.defaultFileName || "coordinate_export";
        }
        if (this.elements.exportIncludeTimestamp) {
            this.elements.exportIncludeTimestamp.checked = modalContext.includeTimestamp !== false;
        }
        if (this.elements.exportIncludeHeader) {
            if (this.elements.exportHeaderToggle) {
                this.elements.exportHeaderToggle.style.display = modalContext.showHeaderToggle === false ? "none" : "";
            }
            this.elements.exportIncludeHeader.checked = modalContext.includeHeader !== false;
        }
        if (this.elements.exportDecimals) {
            if (this.elements.exportDecimalsRow) {
                this.elements.exportDecimalsRow.style.display = modalContext.showDecimals === false ? "none" : "";
            }
            this.elements.exportDecimals.value = modalContext.decimals ?? 3;
        }
        const decimalSettings = Array.isArray(modalContext.decimalSettings) ? modalContext.decimalSettings : [];
        const decimalContext = modalContext.decimalContext || modalContext.mode || null;
        this.exportContext.decimalContext = decimalContext;
        const cachedOverrides = decimalContext && this.decimalOverrideCache ? this.decimalOverrideCache[decimalContext] || {} : {};
        const providedOverrides = modalContext.decimalOverrides && typeof modalContext.decimalOverrides === 'object' ? modalContext.decimalOverrides : {};
        const mergedOverrides = {};
        if (decimalSettings.length) {
            decimalSettings.forEach((setting) => {
                const key = setting.id;
                if (!key) return;
                const defaultValue =
                    providedOverrides[key] !== undefined
                        ? providedOverrides[key]
                        : cachedOverrides[key] !== undefined
                            ? cachedOverrides[key]
                            : setting.default ?? (modalContext.decimals ?? 3);
                mergedOverrides[key] = defaultValue;
            });
        }
        const effectiveOverrides = decimalSettings.length ? mergedOverrides : (Object.keys(providedOverrides).length ? providedOverrides : cachedOverrides);
        this.exportContext.decimalOverrides = decimalSettings.length ? mergedOverrides : (Object.keys(effectiveOverrides).length ? effectiveOverrides : null);
        this.renderDecimalSettings(decimalSettings, decimalSettings.length ? mergedOverrides : null);
        this.renderExportOptions(modalContext.options || []);
        const modal = this.elements.exportModal;
        modal.style.display = "block";
        modal.classList.add("show");
    }


    configureExportFormats(allowedFormats, preferredFormat) {
        if (!this.elements.exportFormatContainer) return;
        const radios = Array.from(
            this.elements.exportFormatContainer.querySelectorAll('input[name="coordinateExportFormat"]')
        );
        let firstAvailable = null;
        radios.forEach((radio) => {
            const label = radio.closest(".format-option");
            const allowed = !allowedFormats || allowedFormats.includes(radio.value);
            radio.disabled = !allowed;
            if (label) {
                label.style.display = allowed ? "" : "none";
            }
            if (allowed && !firstAvailable) {
                firstAvailable = radio;
            }
        });
        let target = radios.find((radio) => radio.value === preferredFormat && !radio.disabled);
        if (!target) {
            target = radios.find((radio) => radio.checked && !radio.disabled) || firstAvailable;
        }
        if (target) {
            target.checked = true;
        }
    }

    renderExportOptions(options) {
        const section = this.elements.exportOptionsSection;
        const container = this.elements.exportOptionsContainer;
        if (!section || !container) return;
        container.innerHTML = "";
        if (!options.length) {
            section.style.display = "none";
            return;
        }
        section.style.display = "";
        options.forEach((option) => {
            const wrapper = document.createElement("div");
            wrapper.className = "export-option-item";
            const label = document.createElement("label");
            label.className = "inline-label";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.dataset.optionId = option.id;
            checkbox.checked = option.checked !== false;
            label.appendChild(checkbox);
            const textSpan = document.createElement("span");
            textSpan.textContent = ` ${option.label}`;
            label.appendChild(textSpan);
            wrapper.appendChild(label);
            if (option.description) {
                const hint = document.createElement("small");
                hint.className = "option-hint";
                hint.textContent = option.description;
                wrapper.appendChild(hint);
            }
            container.appendChild(wrapper);
        });
    }

    renderDecimalSettings(settings, overrides) {
        const row = this.elements.exportDecimalGroupsRow;
        const grid = this.elements.exportDecimalGrid;
        const hint = this.elements.exportDecimalHint;
        if (!row || !grid) return;
        grid.innerHTML = "";
        if (!Array.isArray(settings) || !settings.length) {
            row.style.display = "none";
            if (hint) hint.style.display = "none";
            return;
        }
        row.style.display = "";
        if (hint) {
            hint.style.display = "";
        }
        settings.forEach((setting) => {
            const item = document.createElement("div");
            item.className = "decimal-item";
            const label = document.createElement("span");
            label.className = "decimal-item-label";
            label.textContent = setting.label || setting.id;
            const input = document.createElement("input");
            input.type = "number";
            input.className = "decimal-item-input";
            input.dataset.decimalId = setting.id;
            input.min = setting.min ?? 0;
            input.max = setting.max ?? 10;
            input.step = setting.step ?? 1;
            const defaultValue = overrides && overrides[setting.id] !== undefined
                ? overrides[setting.id]
                : setting.default ?? (this.exportContext?.decimals ?? 3);
            input.value = defaultValue;
            item.appendChild(label);
            item.appendChild(input);
            if (setting.hint) {
                const note = document.createElement("small");
                note.className = "decimal-item-hint";
                note.textContent = setting.hint;
                item.appendChild(note);
            }
            grid.appendChild(item);
        });
    }
    getDecimalSettingsPreset(type) {
        const preset = DECIMAL_SETTING_PRESETS[type] || [];
        return preset.map((item) => ({ ...item }));
    }





    collectExportSettings() {
        if (!this.exportContext) return null;
        const formatInput = this.elements.exportFormatContainer
            ? this.elements.exportFormatContainer.querySelector('input[name="coordinateExportFormat"]:checked')
            : null;
        if (!formatInput) {
            this.showMessage("请选择导出格式。", "warning");
            return null;
        }
        let fileName = this.elements.exportFilename?.value?.trim() || this.exportContext.defaultFileName || "coordinate_export";
        let decimals = this.exportContext.decimals ?? 3;
        if (this.exportContext.showDecimals !== false && this.elements.exportDecimals) {
            const parsed = Number.parseInt(this.elements.exportDecimals.value, 10);
            if (Number.isFinite(parsed)) {
                decimals = Math.min(Math.max(parsed, 0), 10);
            }
        }
        const includeHeader = this.exportContext.showHeaderToggle === false
            ? true
            : Boolean(this.elements.exportIncludeHeader?.checked);
        const includeTimestamp = Boolean(this.elements.exportIncludeTimestamp?.checked);
        const optionStates = {};
        if (this.elements.exportOptionsContainer) {
            this.elements.exportOptionsContainer
                .querySelectorAll('input[type="checkbox"][data-option-id]')
                .forEach((checkbox) => {
                    optionStates[checkbox.dataset.optionId] = checkbox.checked;
                });
        }
        let decimalOverrides = null;
        if (this.elements.exportDecimalGrid) {
            const entries = Array.from(this.elements.exportDecimalGrid.querySelectorAll('input[data-decimal-id]'));
            if (entries.length) {
                decimalOverrides = {};
                entries.forEach((input) => {
                    const key = input.dataset.decimalId;
                    if (!key) return;
                    const value = Number.parseInt(input.value, 10);
                    if (Number.isFinite(value)) {
                        const min = Number.isFinite(Number(input.min)) ? Number(input.min) : 0;
                        const max = Number.isFinite(Number(input.max)) ? Number(input.max) : 12;
                        decimalOverrides[key] = Math.min(Math.max(value, min), max);
                    }
                });
                if (!Object.keys(decimalOverrides).length) {
                    decimalOverrides = null;
                }
            }
        }
        return {
            format: formatInput.value,
            fileName,
            decimals,
            includeHeader,
            includeTimestamp,
            options: optionStates,
            decimalOverrides,
        };
    }

    confirmExport() {
        if (!this.exportContext) {
            this.closeExportModal();
            return;
        }
        const settings = this.collectExportSettings();
        if (!settings) return;
        if (this.exportContext.decimalContext) {
            if (settings.decimalOverrides) {
                this.decimalOverrideCache[this.exportContext.decimalContext] = settings.decimalOverrides;
            } else {
                delete this.decimalOverrideCache[this.exportContext.decimalContext];
            }
        }
        this.exportContext.decimalOverrides = settings.decimalOverrides;
        try {
            if (this.exportContext.mode === "report") {
                this.performReportExport(this.exportContext, settings);
            } else {
                this.performTableExport(this.exportContext, settings);
            }
            this.showMessage(`成功导出为 ${settings.format.toUpperCase()} 格式`, "success");
        } catch (error) {
            console.error("导出失败:", error);
            this.showMessage(`导出失败：${error.message}`, "error");
        } finally {
            this.closeExportModal();
        }
    }

    getCommonDataset(points) {
        return {
            columns: [
                { key: "name", label: "点名" },
                { key: "source.B", label: "源B(°)", formatKey: "angle" },
                { key: "source.L", label: "源L(°)", formatKey: "angle" },
                { key: "source.H", label: "源H(m)", formatKey: "height" },
                { key: "source.X", label: "源X(m)", formatKey: "cartesian" },
                { key: "source.Y", label: "源Y(m)", formatKey: "cartesian" },
                { key: "source.Z", label: "源Z(m)", formatKey: "cartesian" },
                { key: "source.x", label: "源x(m)", formatKey: "plane" },
                { key: "source.y", label: "源y(m)", formatKey: "plane" },
                { key: "source.h", label: "源h(m)", formatKey: "height" },
                { key: "target.B", label: "目标B(°)", formatKey: "angle" },
                { key: "target.L", label: "目标L(°)", formatKey: "angle" },
                { key: "target.H", label: "目标H(m)", formatKey: "height" },
                { key: "target.X", label: "目标X(m)", formatKey: "cartesian" },
                { key: "target.Y", label: "目标Y(m)", formatKey: "cartesian" },
                { key: "target.Z", label: "目标Z(m)", formatKey: "cartesian" },
                { key: "target.x", label: "目标x(m)", formatKey: "plane" },
                { key: "target.y", label: "目标y(m)", formatKey: "plane" },
                { key: "target.h", label: "目标h(m)", formatKey: "height" },
            ],
            rows: points,
        };
    }

    getPendingDataset(points) {
        return {
            columns: [
                { key: "name", label: "点名" },
                { key: "B", label: "B(°)", formatKey: "angle" },
                { key: "L", label: "L(°)", formatKey: "angle" },
                { key: "H", label: "H(m)", formatKey: "height" },
                { key: "X", label: "X(m)", formatKey: "cartesian" },
                { key: "Y", label: "Y(m)", formatKey: "cartesian" },
                { key: "Z", label: "Z(m)", formatKey: "cartesian" },
                { key: "x", label: "x(m)", formatKey: "plane" },
                { key: "y", label: "y(m)", formatKey: "plane" },
                { key: "h", label: "h(m)", formatKey: "height" },
            ],
            rows: points,
        };
    }

    getResultsDataset(results) {
        return {
            columns: [
                { key: "name", label: "点名" },
                { key: "target.B", label: "B(°)", numeric: true, decimals: 8, formatKey: "angle" },
                { key: "target.L", label: "L(°)", numeric: true, decimals: 8, formatKey: "angle" },
                { key: "target.H", label: "H(m)", numeric: true, decimals: 3, formatKey: "height" },
                { key: "target.X", label: "X(m)", numeric: true, decimals: 3, formatKey: "cartesian" },
                { key: "target.Y", label: "Y(m)", numeric: true, decimals: 3, formatKey: "cartesian" },
                { key: "target.Z", label: "Z(m)", numeric: true, decimals: 3, formatKey: "cartesian" },
                { key: "target.x", label: "x(m)", numeric: true, decimals: 3, formatKey: "plane" },
                { key: "target.y", label: "y(m)", numeric: true, decimals: 3, formatKey: "plane" },
                { key: "target.h", label: "h(m)", numeric: true, decimals: 3, formatKey: "height" },
                { key: "error", label: "备注" },
            ],
            rows: results,
        };
    }

    exportCommon() {
        const points = this.collectCommonPoints();
        if (!points.length) {
            this.showMessage("当前没有公共点数据。", "warning");
            return;
        }
        this.openExportModal({
            mode: "table",
            title: "导出公共点数据",
            defaultFileName: "common_points",
            dataset: this.getCommonDataset(points),
            decimals: 3,
            includeHeader: true,
            allowedFormats: ["txt", "dat", "csv", "excel"],
            decimalSettings: this.getDecimalSettingsPreset("table"),
            decimalContext: "commonTable",
        });
    }

    exportPoints() {
        const points = this.collectPoints(false);
        if (!points.length) {
            this.showMessage("当前没有待转换点数据。", "warning");
            return;
        }
        this.openExportModal({
            mode: "table",
            title: "导出待转换点数据",
            defaultFileName: "pending_points",
            dataset: this.getPendingDataset(points),
            decimals: 3,
            includeHeader: true,
            allowedFormats: ["txt", "dat", "csv", "excel"],
            decimalSettings: this.getDecimalSettingsPreset("table"),
            decimalContext: "pendingTable",
        });
    }

    exportResults() {
        if (!this.lastResults.length) {
            this.showMessage("当前没有可导出的转换结果。", "warning");
            return;
        }
        this.openExportModal({
            mode: "table",
            title: "导出转换结果",
            defaultFileName: "conversion_results",
            dataset: this.getResultsDataset(this.lastResults),
            decimals: 3,
            includeHeader: true,
            allowedFormats: ["txt", "dat", "csv", "excel"],
            decimalSettings: this.getDecimalSettingsPreset("table"),
            decimalContext: "resultsTable",
        });
    }

    initiateReportExport() {
        const common = this.collectCommonPoints();
        const pending = this.collectPoints(false);
        const results = this.lastResults || [];
        if (!common.length && !pending.length && !results.length) {
            this.showMessage("暂无可生成报告的数据，请先进行计算。", "warning");
            return;
        }
        this.openExportModal({
            mode: "report",
            title: "导出综合转换报告",
            defaultFileName: "coordinate_report",
            allowedFormats: ["word", "excel", "txt"],
            includeHeader: true,
            includeTimestamp: true,
            showDecimals: true,
            showHeaderToggle: false,
            decimals: 3,
            decimalSettings: this.getDecimalSettingsPreset("report"),
            decimalContext: "report",
            options: [
                { id: "includeOverview", label: "包含基础信息", checked: true },
                { id: "includeParameters", label: "包含参数估计结果", checked: true },
                { id: "includeCommon", label: "包含公共点列表", checked: common.length > 0 },
                { id: "includePending", label: "包含待转换点列表", checked: pending.length > 0 },
                { id: "includeResults", label: "包含转换结果", checked: results.length > 0 },
                { id: "includeAccuracy", label: "包含精度评定", checked: Boolean(this.latestAccuracy) },
            ],
        });
    }

    performTableExport(context, settings) {
        const { headers, rows } = this.buildTableMatrix(context.dataset, settings.decimals, settings.decimalOverrides);
        const baseName = settings.fileName;
        const includeHeader = settings.includeHeader !== false;
        if (["txt", "dat", "csv"].includes(settings.format)) {
            const separator = settings.format === "csv" ? "," : "\t";
            const lines = [];
            if (includeHeader) {
                lines.push(this.formatDelimitedRow(headers, separator));
            }
            rows.forEach((row) => {
                lines.push(this.formatDelimitedRow(row, separator));
            });
            const extension = settings.format;
            const mime = settings.format === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8";
            this.downloadTextFile(
                lines.join("\n"),
                this.buildFileName(baseName, settings.includeTimestamp, extension),
                mime
            );
            return;
        }
        if (settings.format === "excel") {
            const html = this.buildExcelDocument(context.title, headers, rows, includeHeader);
            this.downloadFile(
                html,
                this.buildFileName(baseName, settings.includeTimestamp, "xls"),
                "application/vnd.ms-excel;charset=utf-8"
            );
            return;
        }
        if (settings.format === "word") {
            const html = this.buildWordDocument(context.title, headers, rows, includeHeader);
            this.downloadFile(
                html,
                this.buildFileName(baseName, settings.includeTimestamp, "doc"),
                "application/msword;charset=utf-8"
            );
            return;
        }
        throw new Error("暂不支持的导出格式");
    }

    performReportExport(context, settings) {
        const data = this.buildReportData();
        const opts = settings.options || {};
        const include = {
            overview: opts.includeOverview !== false,
            parameters: opts.includeParameters !== false,
            common: opts.includeCommon !== false,
            pending: opts.includePending !== false,
            results: opts.includeResults !== false,
            accuracy: opts.includeAccuracy !== false,
        };
        const sections = this.createReportSections(data, include, settings.decimals, settings.decimalOverrides);
        if (!sections.length) {
            this.showMessage("报告内容为空，已取消导出。", "warning");
            return;
        }
        const title = context.title || "综合坐标转换报告";
        if (settings.format === "excel") {
            const html = this.buildReportExcelDocument(title, sections);
            this.downloadFile(
                html,
                this.buildFileName(settings.fileName, settings.includeTimestamp, "xls"),
                "application/vnd.ms-excel;charset=utf-8"
            );
            return;
        }
        if (settings.format === "txt") {
            const reportText = this.buildReportTextDocument(title, sections);
            this.downloadTextFile(
                reportText,
                this.buildFileName(settings.fileName, settings.includeTimestamp, "txt"),
                "text/plain;charset=utf-8"
            );
            return;
        }
        if (settings.format === "word") {
            const html = this.buildReportWordDocument(title, sections);
            this.downloadFile(
                html,
                this.buildFileName(settings.fileName, settings.includeTimestamp, "doc"),
                "application/msword;charset=utf-8"
            );
            return;
        }
        throw new Error("暂不支持的报告导出格式");
    }

    buildReportData() {
        return {
            generatedAt: new Date(),
            sourceSystem: this.collectSystemConfig(this.elements.sourceForm),
            targetSystem: this.collectSystemConfig(this.elements.targetForm),
            sevenParameters: this.latestSevenParameters,
            fourParameters: this.latestFourParameters,
            commonPoints: this.collectCommonPoints(),
            pendingPoints: this.collectPoints(false),
            results: this.lastResults || [],
            accuracy: this.latestAccuracy,
        };
    }

    createReportSections(data, include, decimals, decimalOverrides = {}) {
        const overrides = decimalOverrides && typeof decimalOverrides === "object" ? decimalOverrides : {};
        const sections = [];
        if (include.overview) {
            sections.push({
                title: "总体信息",
                type: "table",
                headers: ["项目", "数值"],
                rows: [
                    ["生成时间", data.generatedAt.toLocaleString()],
                    ["公共点数量", data.commonPoints.length],
                    ["待转换点数量", data.pendingPoints.length],
                    ["成果点数量", data.results.length],
                ],
            });
        }
        if (include.parameters && (data.sevenParameters || data.fourParameters)) {
            const seven = data.sevenParameters || {};
            const four = data.fourParameters || {};
            const sevenRotation = seven.rotation_arcsec || {};
            const translationDecimals = this.resolveDecimalValue(6, overrides, "parameterTranslation");
            const rotationDecimals = this.resolveDecimalValue(6, overrides, "parameterRotation");
            const scaleDecimals = this.resolveDecimalValue(6, overrides, "parameterScale");
            sections.push({
                title: "七参数解算结果",
                type: "table",
                headers: ["指标", "取值"],
                rows: [
                    ["ΔX (m)", this.formatNumber(seven.dx, translationDecimals)],
                    ["ΔY (m)", this.formatNumber(seven.dy, translationDecimals)],
                    ["ΔZ (m)", this.formatNumber(seven.dz, translationDecimals)],
                    ["Rx (″)", this.formatNumber(sevenRotation.rx, rotationDecimals)],
                    ["Ry (″)", this.formatNumber(sevenRotation.ry, rotationDecimals)],
                    ["Rz (″)", this.formatNumber(sevenRotation.rz, rotationDecimals)],
                    ["尺度 (ppm)", this.formatNumber(seven.scale_ppm, scaleDecimals)],
                ],
            });
            sections.push({
                title: "四参数解算结果",
                type: "table",
                headers: ["指标", "取值"],
                rows: [
                    ["ΔX (m)", this.formatNumber(four.dx, translationDecimals)],
                    ["ΔY (m)", this.formatNumber(four.dy, translationDecimals)],
                    ["旋转(″)", this.formatNumber(four.rotation_arcsec, rotationDecimals)],
                    ["尺度 (ppm)", this.formatNumber(four.scale_ppm, scaleDecimals)],
                ],
            });
        }
        if (include.common && data.commonPoints.length) {
            const dataset = this.getCommonDataset(data.commonPoints);
            const { headers, rows } = this.buildTableMatrix(dataset, decimals, overrides);
            sections.push({ title: "公共点列表", type: "table", headers, rows });
        }
        if (include.pending && data.pendingPoints.length) {
            const dataset = this.getPendingDataset(data.pendingPoints);
            const { headers, rows } = this.buildTableMatrix(dataset, decimals, overrides);
            sections.push({ title: "待转换点列表", type: "table", headers, rows });
        }
        if (include.results && data.results.length) {
            const dataset = this.getResultsDataset(data.results);
            const { headers, rows } = this.buildTableMatrix(dataset, decimals, overrides);
            sections.push({ title: "转换成果", type: "table", headers, rows });
        }
        if (include.accuracy && data.accuracy) {
            const accuracyDecimals = this.resolveDecimalValue(4, overrides, "accuracy");
            const accuracyRows = [];
            if (data.accuracy.seven) {
                const seven = data.accuracy.seven;
                const sevenRmse = seven.rmse || {};
                accuracyRows.push(["七参数RMSE X", this.formatNumber(sevenRmse.x, accuracyDecimals)]);
                accuracyRows.push(["七参数RMSE Y", this.formatNumber(sevenRmse.y, accuracyDecimals)]);
                accuracyRows.push(["七参数RMSE Z", this.formatNumber(sevenRmse.z, accuracyDecimals)]);
                if (seven.maxResidual !== undefined) {
                    accuracyRows.push(["七参数最大残差", this.formatNumber(seven.maxResidual, accuracyDecimals)]);
                }
            }
            if (data.accuracy.four) {
                const four = data.accuracy.four;
                const fourRmse = four.rmse || {};
                accuracyRows.push(["四参数RMSE X", this.formatNumber(fourRmse.x, accuracyDecimals)]);
                accuracyRows.push(["四参数RMSE Y", this.formatNumber(fourRmse.y, accuracyDecimals)]);
                if (four.maxResidual !== undefined) {
                    accuracyRows.push(["四参数最大残差", this.formatNumber(four.maxResidual, accuracyDecimals)]);
                }
            }
            if (accuracyRows.length) {
                sections.push({
                    title: "精度指标",
                    type: "table",
                    headers: ["指标", "数值"],
                    rows: accuracyRows,
                });
            }
        }
        return sections;
    }


    buildTableMatrix(dataset, decimals, decimalOverrides = {}) {
        const columns = dataset.columns || [];
        const overrideMap = decimalOverrides && typeof decimalOverrides === 'object' ? decimalOverrides : {};
        const rows = (dataset.rows || []).map((row) =>
            columns.map((col) => {
                const rawValue = typeof col.value === 'function' ? col.value(row) : this.resolveDatasetValue(row, col.key);
                if (typeof col.format === 'function') {
                    return col.format(rawValue, row, col);
                }
                const overrideDecimals = col.formatKey && Object.prototype.hasOwnProperty.call(overrideMap, col.formatKey)
                    ? overrideMap[col.formatKey]
                    : undefined;
                const columnDecimals = overrideDecimals !== undefined
                    ? overrideDecimals
                    : col.decimals !== undefined
                        ? col.decimals
                        : decimals;
                return this.formatValue(rawValue, columnDecimals, col.numeric === true);
            })
        );
        const headers = columns.map((col) => col.label || col.key || '');
        return { headers, rows };
    }


    resolveDecimalValue(defaultValue, overrides, key) {
        if (overrides && key && Object.prototype.hasOwnProperty.call(overrides, key)) {
            const parsed = Number(overrides[key]);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return defaultValue;
    }

    resolveDatasetValue(row, path) {
        if (!path) return row;
        return path.split(".").reduce((acc, key) => {
            if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
                return acc[key];
            }
            return null;
        }, row);
    }

    formatValue(value, decimals, numeric) {
        if (value === undefined || value === null || value === "") return "";
        if (numeric) {
            const num = Number(value);
            if (Number.isFinite(num)) {
                return this.formatNumber(num, decimals);
            }
        }
        if (typeof value === "number") {
            return this.formatNumber(value, decimals);
        }
        return String(value);
    }

    buildFileName(baseName, includeTimestamp, extension) {
        const sanitized = (baseName || "coordinate_export").replace(/[\\/:*?"<>|]/g, "_");
        const stamp = includeTimestamp ? `_${this.makeTimestamp()}` : "";
        return `${sanitized}${stamp}.${extension}`;
    }

    buildTableHtml(title, headers, rows, includeHeader = true) {
        const headerHtml = includeHeader
            ? `<tr>${headers.map((text) => `<th>${this.escapeHtml(text)}</th>`).join("")}</tr>`
            : "";
        const bodyHtml = rows
            .map((row) => `<tr>${row.map((cell) => `<td>${this.escapeHtml(cell)}</td>`).join("")}</tr>`)
            .join("");
        return `<table class="report-table">${headerHtml}${bodyHtml}</table>`;
    }

    buildExcelDocument(title, headers, rows, includeHeader) {
        const table = this.buildTableHtml(title, headers, rows, includeHeader);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Segoe UI,Arial,sans-serif;}h2{margin:12px 0;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #999;padding:6px 8px;text-align:center;}th{background:#e6f2ff;}</style></head><body>${title ? `<h2>${this.escapeHtml(title)}</h2>` : ""}${table}</body></html>`;
    }

    buildWordDocument(title, headers, rows, includeHeader) {
        const table = this.buildTableHtml(title, headers, rows, includeHeader);
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:\"Microsoft YaHei\",Segoe UI,sans-serif;margin:24px;}h1{font-size:22px;margin-bottom:16px;color:#1e40af;}table{border-collapse:collapse;width:100%;margin:16px 0;}th,td{border:1px solid #b6c2d9;padding:8px 10px;text-align:center;}th{background:#e0ecff;font-weight:600;}section{margin-bottom:24px;}section h2{font-size:18px;margin-bottom:8px;color:#374151;}small.option-hint{color:#6b7280;display:block;margin-top:4px;}</style></head><body><h1>${this.escapeHtml(title || "综合坐标转换报告")}</h1>${table}</body></html>`;
    }

    buildReportExcelDocument(title, sections) {
        const sectionHtml = sections
            .map((section) => {
                if (section.type === "table") {
                    const table = this.buildTableHtml(section.title, section.headers, section.rows, true);
                    return `${section.title ? `<h2>${this.escapeHtml(section.title)}</h2>` : ""}${table}`;
                }
                return section.content || "";
            })
            .join("");
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Segoe UI,Arial,sans-serif;}h1{font-size:22px;margin-bottom:16px;}h2{font-size:18px;margin:18px 0 8px;}table{border-collapse:collapse;width:100%;margin-bottom:12px;}th,td{border:1px solid #999;padding:6px 8px;text-align:center;}th{background:#e6f2ff;}</style></head><body><h1>${this.escapeHtml(title)}</h1>${sectionHtml}</body></html>`;
    }

    buildReportTextDocument(title, sections) {
        const lines = [];
        const header = title || "综合坐标转换报告";
        lines.push(header);
        lines.push("=".repeat(header.length));
        (sections || []).forEach((section, index) => {
            lines.push("");
            const sectionTitle = section.title ? `${index + 1}. ${section.title}` : `${index + 1}.`;
            lines.push(sectionTitle);
            if (section.type === "table" && Array.isArray(section.rows)) {
                const headers = Array.isArray(section.headers) ? section.headers : [];
                if (headers.length) {
                    lines.push(headers.join("\t"));
                }
                section.rows.forEach((row) => {
                    const cells = Array.isArray(row) ? row : [row];
                    lines.push(
                        cells
                            .map((cell) => (cell === undefined || cell === null ? "" : String(cell)))
                            .join("\t")
                    );
                });
            } else if (section.content) {
                lines.push(section.content);
            }
        });
        return lines.join("\n");
    }
    buildReportWordDocument(title, sections) {
        const sectionHtml = sections
            .map((section) => {
                if (section.type === "table") {
                    const table = this.buildTableHtml(section.title, section.headers, section.rows, true);
                    return `<section><h2>${this.escapeHtml(section.title)}</h2>${table}</section>`;
                }
                return `<section>${section.content || ""}</section>`;
            })
            .join("");
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:\"Microsoft YaHei\",Segoe UI,sans-serif;margin:32px 40px;color:#1f2933;line-height:1.6;}h1{font-size:26px;margin-bottom:18px;color:#1e3a8a;}h2{font-size:20px;margin:24px 0 12px;color:#1f2937;}table{border-collapse:collapse;width:100%;margin-bottom:16px;}th,td{border:1px solid #cbd5f5;padding:8px 10px;text-align:center;}th{background:#eff6ff;font-weight:600;}p{margin:6px 0;}</style></head><body><h1>${this.escapeHtml(title)}</h1>${sectionHtml}</body></html>`;
    }

    escapeHtml(value) {
        if (value === null || value === undefined) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    formatNumber(value, decimals) {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        if (!Number.isFinite(num)) return value;
        return typeof decimals === "number" ? num.toFixed(decimals) : String(num);
    }

    downloadTextFile(content, filename, mime) {
        this.downloadFile(content, filename, mime || "text/plain;charset=utf-8");
    }

    downloadFile(content, filename, mimeType = "application/octet-stream") {
        const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    makeTimestamp() {
        return new Date().toISOString().replace(/[:.-]/g, "");
    }

    showMessage(message, type = "info") {
        if (window.notificationSystem?.show) {
            window.notificationSystem.show(message, type);
        } else if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            console.log(`[${type}]`, message);
        }
    }

    // 解析数据用于预览
    parseDataForPreview(raw) {
        if (!raw || !raw.trim()) return [];
        
        // 尝试检测分隔符
        const lines = raw.trim().split('\n');
        if (lines.length === 0) return [];
        
        // 检测分隔符：制表符、逗号或空格
        let separator = '\t';
        const firstLine = lines[0];
        
        if (firstLine.includes(',')) {
            separator = ',';
        } else if (!firstLine.includes('\t') && firstLine.includes(' ')) {
            separator = ' ';
        }
        
        // 解析数据
        const data = [];
        for (let i = 0; i < Math.min(lines.length, 10); i++) { // 只预览前10行
            const line = lines[i].trim();
            if (!line) continue;
            
            // 简单的分割逻辑，不考虑引号包围的复杂情况
            const values = line.split(separator).map(v => v.trim());
            data.push(values);
        }
        
        return data;
    }

    // 检查是否需要字段映射
    needsFieldMapping(previewData, targetType) {
        if (!previewData || previewData.length === 0) return false;
        
        // 获取目标表格的期望字段数
        let expectedFieldCount = 0;
        switch (targetType) {
            case "common":
                expectedFieldCount = 19; // 公共点表格有19个字段
                break;
            case "points":
                expectedFieldCount = 10; // 待转换点表格有10个字段
                break;
            case "results":
                expectedFieldCount = 11; // 结果表格有11个字段
                break;
        }
        
        // 如果数据字段数与期望字段数不匹配，则需要字段映射
        const actualFieldCount = previewData[0].length;
        return actualFieldCount !== expectedFieldCount;
    }

    // 打开字段映射模态框
    openFieldMappingModal(raw, targetType) {
        this.fieldMappingData = {
            raw: raw,
            targetType: targetType,
            previewData: this.parseDataForPreview(raw)
        };
        
        // 显示预览数据（包含字段映射选项）
        this.showDataPreview(this.fieldMappingData.previewData);
        
        // 隐藏字段映射容器，因为现在字段映射在表头中
        if (this.elements.fieldMappingContainer) {
            this.elements.fieldMappingContainer.style.display = 'none';
        }
        
        // 显示模态框
        if (this.elements.fieldMappingModal) {
            this.elements.fieldMappingModal.style.display = 'flex';
        }
    }

    // 显示数据预览
    showDataPreview(previewData) {
        const previewContainer = this.elements.dataPreview;
        if (!previewContainer) return;
        
        // 清空预览区域
        previewContainer.innerHTML = '';
        
        // 创建预览容器
        const container = document.createElement('div');
        container.className = 'data-preview-container';
        
        // 创建预览表格
        const table = document.createElement('table');
        table.className = 'data-preview-table';
        
        // 添加表头
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // 获取最大列数
        const maxCols = Math.max(...previewData.map(row => row.length));
        
        // 获取目标表格的字段
        let targetFields = [];
        if (this.fieldMappingData) {
            switch (this.fieldMappingData.targetType) {
                case "common":
                    targetFields = [
                        "点名", "源.B(°)", "源.L(°)", "源.H(m)", "源.X(m)", "源.Y(m)", "源.Z(m)", 
                        "源.x(m)", "源.y(m)", "源.h(m)", "目标.B(°)", "目标.L(°)", "目标.H(m)", "目标.X(m)", 
                        "目标.Y(m)", "目标.Z(m)", "目标.x(m)", "目标.y(m)", "目标.h(m)"
                    ];
                    break;
                case "points":
                    targetFields = [
                        "点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", 
                        "x(m)", "y(m)", "h(m)"
                    ];
                    break;
                case "results":
                    targetFields = [
                        "点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", 
                        "x(m)", "y(m)", "h(m)", "备注"
                    ];
                    break;
            }
        }
        
        // 创建表头单元格，包含下拉选择框
        for (let i = 0; i < maxCols; i++) {
            const th = document.createElement('th');
            th.className = 'preview-header-cell';
            
            // 创建列标题
            const columnTitle = document.createElement('div');
            columnTitle.className = 'column-title';
            columnTitle.textContent = `列 ${i + 1}`;
            th.appendChild(columnTitle);
            
            // 创建字段选择下拉框
            const select = document.createElement('select');
            select.className = 'field-mapping-select header-select';
            select.setAttribute('data-column-index', i);
            
            // 添加"不导入"选项
            const noneOption = document.createElement('option');
            noneOption.value = '-1';
            noneOption.textContent = '不导入';
            select.appendChild(noneOption);
            
            // 添加目标字段选项
            targetFields.forEach((field, index) => {
                const option = document.createElement('option');
                option.value = index.toString();
                option.textContent = field;
                
                // 尝试自动匹配
                if (this.autoMatchField(field, i, maxCols, targetFields)) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });
            
            th.appendChild(select);
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // 添加数据行
        const tbody = document.createElement('tbody');
        for (let i = 0; i < Math.min(previewData.length, 5); i++) { // 只显示前5行
            const tr = document.createElement('tr');
            const row = previewData[i];
            
            for (let j = 0; j < maxCols; j++) {
                const td = document.createElement('td');
                td.textContent = row[j] || '';
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        }
        
        table.appendChild(tbody);
        container.appendChild(table);
        previewContainer.appendChild(container);
        
        // 保存字段映射配置
        this.fieldMappingConfig = {
            targetType: this.fieldMappingData ? this.fieldMappingData.targetType : null,
            targetFields: targetFields,
            maxCols: maxCols
        };
    }

    // 生成字段映射选项
    generateFieldMappingOptions(targetType) {
        const mappingContainer = this.elements.fieldMappingContainer;
        if (!mappingContainer) return;
        
        // 清空映射区域
        mappingContainer.innerHTML = '';
        
        // 获取目标表格的字段
        let targetFields = [];
        switch (targetType) {
            case "common":
                targetFields = [
                    "点名", "源.B(°)", "源.L(°)", "源.H(m)", "源.X(m)", "源.Y(m)", "源.Z(m)", 
                    "源.x(m)", "源.y(m)", "源.h(m)", "目标.B(°)", "目标.L(°)", "目标.H(m)", "目标.X(m)", 
                    "目标.Y(m)", "目标.Z(m)", "目标.x(m)", "目标.y(m)", "目标.h(m)"
                ];
                break;
            case "points":
                targetFields = [
                    "点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", 
                    "x(m)", "y(m)", "h(m)"
                ];
                break;
            case "results":
                targetFields = [
                    "点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", 
                    "x(m)", "y(m)", "h(m)", "备注"
                ];
                break;
        }
        
        // 获取数据列数
        const maxCols = Math.max(...this.fieldMappingData.previewData.map(row => row.length));
        
        // 创建字段映射行
        targetFields.forEach((field, index) => {
            const row = document.createElement('div');
            row.className = 'field-mapping-row';
            
            // 字段标签
            const label = document.createElement('label');
            label.textContent = field;
            label.className = 'field-mapping-label';
            row.appendChild(label);
            
            // 字段选择下拉框
            const select = document.createElement('select');
            select.className = 'field-mapping-select';
            
            // 添加"不导入"选项
            const noneOption = document.createElement('option');
            noneOption.value = '-1';
            noneOption.textContent = '不导入';
            select.appendChild(noneOption);
            
            // 添加数据列选项
            for (let i = 0; i < maxCols; i++) {
                const option = document.createElement('option');
                option.value = i.toString();
                option.textContent = `列 ${i + 1}`;
                
                // 尝试自动匹配
                if (this.autoMatchField(field, i, maxCols, targetFields)) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            }
            
            row.appendChild(select);
            mappingContainer.appendChild(row);
        });
        
        // 保存字段映射配置
        this.fieldMappingConfig = {
            targetType: targetType,
            targetFields: targetFields,
            maxCols: maxCols
        };
    }

    // 自动匹配字段
    autoMatchField(field, colIndex, totalCols, targetFields) {
        // 默认按表头顺序建立映射关系
        // 获取当前字段在目标字段列表中的索引
        const fields = targetFields || [];
        const fieldIndex = fields.indexOf(field);
        
        // 如果当前字段在目标字段列表中，且列索引等于字段索引，则自动匹配
        if (fieldIndex >= 0 && colIndex === fieldIndex) {
            return true;
        }
        
        // 特殊处理：点名字段通常在第一列
        const fieldLower = field.toLowerCase();
        if (fieldLower.includes('点') && colIndex === 0) {
            return true;
        }
        
        return false;
    }

    // 处理字段映射确认
    handleFieldMappingConfirm() {
        if (!this.fieldMappingConfig || !this.fieldMappingData) {
            this.showMessage("字段映射配置错误", "error");
            return;
        }
        
        // 获取字段映射 - 从表头下拉框获取
        const selects = document.querySelectorAll('.header-select');
        
        // 创建反向映射：从目标字段索引到源列索引
        const reverseMapping = new Array(this.fieldMappingConfig.targetFields.length).fill(-1);
        
        selects.forEach(select => {
            const colIndex = parseInt(select.getAttribute('data-column-index'));
            const targetFieldIndex = parseInt(select.value);
            
            if (targetFieldIndex >= 0) {
                reverseMapping[targetFieldIndex] = colIndex;
            }
        });
        
        // 应用字段映射导入数据
        const result = this.importWithFieldMapping(
            this.fieldMappingData.raw, 
            this.fieldMappingData.targetType, 
            reverseMapping
        );
        
        if (result.success) {
            this.closeFieldMappingModal();
            const label = UNIVERSAL_IMPORT_LABELS[this.fieldMappingData.targetType] || "数据";
            const countText = typeof result.count === "number" && result.count > 0 ? `（${result.count} 条）` : "";
            
            // 检查表格是否已有有效数据（非空行），以显示不同的成功消息
            let hasExistingData = false;
            switch (this.fieldMappingData.targetType) {
                case "common":
                    hasExistingData = this.elements.commonBody && 
                        Array.from(this.elements.commonBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-section="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    break;
                case "points":
                    hasExistingData = this.elements.pointsBody && 
                        Array.from(this.elements.pointsBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-field="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    break;
                case "results":
                    hasExistingData = this.elements.resultsBody && this.elements.resultsBody.children.length > 0;
                    break;
            }
            
            if (hasExistingData) {
                this.showMessage(`${label}已合并，相同点号数据已更新，不同点号数据已追加${countText}。`, "success");
            } else {
                this.showMessage(`${label}导入完成，可继续计算${countText}。`, "success");
            }
        } else if (result.code === "empty") {
            this.showMessage("请粘贴需要导入的数据内容。", "warning");
        } else {
            const errorMessage = result.error?.message || "未知错误";
            this.showMessage(`导入失败：${errorMessage}`, "error");
        }
    }

    // 使用字段映射导入数据
    importWithFieldMapping(raw, targetType, mapping) {
        if (!raw || !raw.trim()) return { success: false, code: "empty" };
        
        try {
            const lines = raw.trim().split('\n');
            const points = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // 分割行数据
                const values = this.splitLine(line);
                
                // 根据映射提取数据
                const mappedValues = {};
                mapping.forEach((sourceIndex, targetIndex) => {
                    if (sourceIndex >= 0 && sourceIndex < values.length) {
                        mappedValues[targetIndex] = values[sourceIndex];
                    }
                });
                
                // 根据目标类型解析数据
                let point;
                switch (targetType) {
                    case "common":
                        point = this.parseCommonImportWithMapping(mappedValues);
                        break;
                    case "points":
                        point = this.parsePointImportWithMapping(mappedValues);
                        break;
                    case "results":
                        point = this.parseResultsImportWithMapping(mappedValues);
                        break;
                }
                
                if (point) {
                    points.push(point);
                }
            }
            
            // 应用数据到表格
            if (points.length > 0) {
                // 检查表格是否已有有效数据（非空行）
            let hasExistingData = false;
            switch (targetType) {
                case "common":
                    hasExistingData = this.elements.commonBody && 
                        Array.from(this.elements.commonBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-section="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    break;
                case "points":
                    hasExistingData = this.elements.pointsBody && 
                        Array.from(this.elements.pointsBody.children).some(row => {
                            const nameInput = row.querySelector('input[data-field="name"]');
                            return nameInput && nameInput.value.trim();
                        });
                    break;
                case "results":
                    hasExistingData = this.elements.resultsBody && this.elements.resultsBody.children.length > 0;
                    break;
            }
                
                // 如果有现有数据，自动合并数据（相同点号更新，不同点号追加）
                if (hasExistingData) {
                    // 合并数据
                    switch (targetType) {
                        case "common":
                            this.mergeCommonPoints(points);
                            break;
                        case "points":
                            this.mergePoints(points);
                            break;
                        case "results":
                            this.mergeResults(points);
                            break;
                    }
                } else {
                    // 没有现有数据，直接填充
                    switch (targetType) {
                        case "common":
                            this.populateCommonPoints(points);
                            break;
                        case "points":
                            this.populatePoints(points);
                            break;
                        case "results":
                            this.populateResults(points);
                            break;
                    }
                }
                
                return { success: true, count: points.length };
            } else {
                return { success: false, error: { message: "未能解析出有效数据" } };
            }
        } catch (error) {
            return { success: false, error: error };
        }
    }

    // 添加公共点行
    addCommonRow(data = {}) {
        if (!this.elements.commonBody) return;

        const normalized = {
            name: data && typeof data === "object" ? data.name ?? "" : "",
            source: {},
            target: {},
        };
        const flat = data && typeof data === "object" ? data : {};
        const source = flat.source && typeof flat.source === "object" ? flat.source : {};
        const target = flat.target && typeof flat.target === "object" ? flat.target : {};

        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const value = source[field] ?? flat[field] ?? "";
            normalized.source[field] = value ?? "";
        });
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const value = target[field];
            normalized.target[field] = value ?? "";
        });

        const tr = document.createElement("tr");
        const createCell = (section, field, value) => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = section === "name" || field === "B" || field === "L" ? "text" : "number";
            input.className = "table-input";
            input.dataset.section = section;
            input.dataset.field = field;
            if (value !== undefined && value !== null && value !== "") {
                input.value = value;
            }
            td.appendChild(input);
            return td;
        };

        tr.appendChild(createCell("name", "name", normalized.name));
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            tr.appendChild(createCell("source", field, normalized.source[field]));
        });
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            tr.appendChild(createCell("target", field, normalized.target[field]));
        });

        this.elements.commonBody.appendChild(tr);
    }
    
    // 添加待转换点行
    addPointRow(data = {}) {
        if (!this.elements.pointsBody) return;

        const tr = document.createElement("tr");
        UNIVERSAL_POINT_FIELDS.forEach((field) => {
            const td = document.createElement("td");
            const input = document.createElement("input");
            input.type = field === "name" || field === "B" || field === "L" ? "text" : "number";
            input.className = "table-input";
            input.dataset.field = field;
            const value = data && typeof data === "object" ? data[field] : undefined;
            if (value !== undefined && value !== null && value !== "") {
                input.value = value;
            }
            td.appendChild(input);
            tr.appendChild(td);
        });

        this.elements.pointsBody.appendChild(tr);
    }

    // 确认是否追加数据
    confirmAppendData(targetType, count) {
        const typeNames = {
            "common": "公共点",
            "points": "待转换点",
            "results": "转换结果"
        };
        
        const typeName = typeNames[targetType] || "数据";
        const message = `当前表格中已有${typeName}数据。\n\n是否要追加导入的 ${count} 条数据？\n\n点击"确定"追加数据，点击"取消"替换现有数据。`;
        
        // 使用原生confirm对话框
        const result = confirm(message);
        return result; // true表示追加，false表示替换
    }
    
    // 合并公共点数据（相同点号更新，不同点号追加）
    mergeCommonPoints(newPoints) {
        if (!this.elements.commonBody || !Array.isArray(newPoints) || !newPoints.length) return;

        // 获取现有表格中的点号映射
        const existingPointMap = new Map();
        const rows = Array.from(this.elements.commonBody.children);
        
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('input[data-section="name"]');
            if (nameInput) {
                const pointName = nameInput.value.trim();
                // 只记录有名称的点，忽略空行
                if (pointName) {
                    existingPointMap.set(pointName, { row, index });
                }
            }
        });

        // 如果有空行，先移除它们
        rows.forEach((row) => {
            const nameInput = row.querySelector('input[data-section="name"]');
            if (nameInput && !nameInput.value.trim()) {
                row.remove();
            }
        });

        // 处理新导入的点
        newPoints.forEach(point => {
            const pointName = (point.name || '').trim();
            
            if (pointName && existingPointMap.has(pointName)) {
                // 点号已存在，更新现有行
                const { row } = existingPointMap.get(pointName);
                this.updateCommonRow(row, point);
            } else {
                // 点号不存在，添加新行
                this.addCommonRow(point);
            }
        });
    }

    // 合并待转换点数据（相同点号更新，不同点号追加）
    mergePoints(newPoints) {
        if (!this.elements.pointsBody || !Array.isArray(newPoints) || !newPoints.length) return;

        // 获取现有表格中的点号映射
        const existingPointMap = new Map();
        const rows = Array.from(this.elements.pointsBody.children);
        
        rows.forEach((row, index) => {
            const nameInput = row.querySelector('input[data-field="name"]');
            if (nameInput) {
                const pointName = nameInput.value.trim();
                // 只记录有名称的点，忽略空行
                if (pointName) {
                    existingPointMap.set(pointName, { row, index });
                }
            }
        });

        // 如果有空行，先移除它们
        rows.forEach((row) => {
            const nameInput = row.querySelector('input[data-field="name"]');
            if (nameInput && !nameInput.value.trim()) {
                row.remove();
            }
        });

        // 处理新导入的点
        newPoints.forEach(point => {
            const pointName = (point.name || '').trim();
            
            if (pointName && existingPointMap.has(pointName)) {
                // 点号已存在，更新现有行
                const { row } = existingPointMap.get(pointName);
                this.updatePointRow(row, point);
            } else {
                // 点号不存在，添加新行
                this.addPointRow(point);
            }
        });
    }

    // 合并结果数据（相同点号更新，不同点号追加）
    mergeResults(newResults) {
        if (!Array.isArray(newResults) || !newResults.length) return;

        // 获取现有结果数据
        const existingResults = Array.isArray(this.lastResults) ? this.lastResults : [];
        const existingResultMap = new Map();
        
        // 创建点号到结果项的映射
        existingResults.forEach((result, index) => {
            const pointName = (result.name || '').trim();
            if (pointName) {
                existingResultMap.set(pointName, { result, index });
            }
        });

        // 处理新导入的结果
        newResults.forEach(newResult => {
            const pointName = (newResult.name || '').trim();
            
            if (pointName && existingResultMap.has(pointName)) {
                // 点号已存在，更新现有结果
                const { index } = existingResultMap.get(pointName);
                existingResults[index] = newResult;
            } else {
                // 点号不存在，添加新结果
                existingResults.push(newResult);
            }
        });

        // 重新填充结果表格
        this.populateResults(existingResults);
    }

    // 更新公共点行数据
    updateCommonRow(row, data) {
        if (!row) return;

        const normalized = {
            name: data && typeof data === "object" ? data.name ?? "" : "",
            source: {},
            target: {},
        };
        const flat = data && typeof data === "object" ? data : {};
        const source = flat.source && typeof flat.source === "object" ? flat.source : {};
        const target = flat.target && typeof flat.target === "object" ? flat.target : {};

        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const value = source[field] ?? flat[field] ?? "";
            normalized.source[field] = value ?? "";
        });
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const value = target[field];
            normalized.target[field] = value ?? "";
        });

        // 更新点名字段
        const nameInput = row.querySelector('input[data-section="name"]');
        if (nameInput && normalized.name) {
            nameInput.value = normalized.name;
        }

        // 更新源坐标字段
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const input = row.querySelector(`input[data-section="source"][data-field="${field}"]`);
            if (input && normalized.source[field] !== undefined && normalized.source[field] !== null && normalized.source[field] !== "") {
                input.value = normalized.source[field];
            }
        });

        // 更新目标坐标字段
        UNIVERSAL_COMMON_FIELDS.forEach((field) => {
            const input = row.querySelector(`input[data-section="target"][data-field="${field}"]`);
            if (input && normalized.target[field] !== undefined && normalized.target[field] !== null && normalized.target[field] !== "") {
                input.value = normalized.target[field];
            }
        });
    }

    // 更新待转换点行数据
    updatePointRow(row, data) {
        if (!row) return;

        UNIVERSAL_POINT_FIELDS.forEach((field) => {
            const input = row.querySelector(`input[data-field="${field}"]`);
            const value = data && typeof data === "object" ? data[field] : undefined;
            if (input && value !== undefined && value !== null && value !== "") {
                input.value = value;
            }
        });
    }

    // 追加结果数据
    appendResults(results) {
        if (!Array.isArray(results) || !results.length) return;

        const merged = (Array.isArray(this.lastResults) ? this.lastResults : []).concat(results);
        this.populateResults(merged);
    }

    // 将值转换为数字，如果无法转换则返回null
    toNumber(value) {
        if (value === null || value === undefined || value === "") return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    // 使用映射解析公共点数据
    parseCommonImportWithMapping(mappedValues) {
        try {
            const getValue = (index) => {
                const value = mappedValues[index];
                return value === undefined || value === null ? "" : String(value).trim();
            };
            const point = {
                name: getValue(0),
                source: {
                    B: getValue(1),
                    L: getValue(2),
                    H: getValue(3),
                    X: getValue(4),
                    Y: getValue(5),
                    Z: getValue(6),
                    x: getValue(7),
                    y: getValue(8),
                    h: getValue(9),
                },
                target: {
                    B: getValue(10),
                    L: getValue(11),
                    H: getValue(12),
                    X: getValue(13),
                    Y: getValue(14),
                    Z: getValue(15),
                    x: getValue(16),
                    y: getValue(17),
                    h: getValue(18),
                },
            };
            const hasSource = Object.values(point.source).some((val) => val !== "");
            const hasTarget = Object.values(point.target).some((val) => val !== "");
            if (point.name || hasSource || hasTarget) {
                return point;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // 使用字段映射解析待转换点数据
    parsePointImportWithMapping(mappedValues) {
        try {
            const getValue = (index) => {
                const value = mappedValues[index];
                return value === undefined || value === null ? "" : String(value).trim();
            };
            const point = {
                name: getValue(0),
                B: getValue(1),
                L: getValue(2),
                H: getValue(3),
                X: getValue(4),
                Y: getValue(5),
                Z: getValue(6),
                x: getValue(7),
                y: getValue(8),
                h: getValue(9),
            };
            const hasData = Object.values(point).some((val) => val !== "");
            if (hasData) {
                return point;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // 使用字段映射解析成果数据
    parseResultsImportWithMapping(mappedValues) {
        try {
            const getValue = (index) => {
                const value = mappedValues[index];
                return value === undefined || value === null ? "" : String(value).trim();
            };
            const target = {
                B: this.toNumber(getValue(1)),
                L: this.toNumber(getValue(2)),
                H: this.toNumber(getValue(3)),
                X: this.toNumber(getValue(4)),
                Y: this.toNumber(getValue(5)),
                Z: this.toNumber(getValue(6)),
                x: this.toNumber(getValue(7)),
                y: this.toNumber(getValue(8)),
                h: this.toNumber(getValue(9)),
            };
            const item = {
                name: getValue(0),
                target,
                error: getValue(10),
            };
            const hasTarget = Object.values(target).some((val) => val !== null);
            if (item.name || hasTarget || item.error) {
                return item;
            }
            return null;
        } catch (e) {
            return null;
        }
    }




    // 关闭字段映射模态框
    closeFieldMappingModal() {
        if (this.elements.fieldMappingModal) {
            this.elements.fieldMappingModal.style.display = 'none';
        }
        this.fieldMappingData = null;
        this.fieldMappingConfig = null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.coordinateUniversalApp = new CoordinateUniversalApp();
});

