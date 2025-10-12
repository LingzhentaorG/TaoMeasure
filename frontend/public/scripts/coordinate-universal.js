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

class CoordinateUniversalApp {
    constructor() {
        this.apiUrl = this._resolveApiUrl();
        this.metadata = { ellipsoids: [] };
        this.manualModes = { seven: false, four: false };
        this.lastResults = [];
        this.elements = {};
        this.currentImportTarget = null;
        this.importFileInputs = {};
        // 字段映射相关变量
        this.fieldMappingData = null;
        this.fieldMappingConfig = {};
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
            "universal-import-confirm": () => this.handleImport(),
            "field-mapping-confirm": () => this.handleFieldMappingConfirm(),
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
                this.closeImportModal();
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
            select.innerHTML = "";
            ellipsoids.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.name;
                option.textContent = item.name;
                select.appendChild(option);
            });
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
        const record = (this.metadata.ellipsoids || []).find((item) => item.name === select.value);
        if (!record) return;
        const form = select.closest(".system-form");
        if (!form) return;
        const aInput = form.querySelector('[data-target="ellipsoid.a"]');
        const invInput = form.querySelector('[data-target="ellipsoid.inverse_flattening"]');
        if (aInput && aInput.dataset.auto !== "false") {
            aInput.value = record.a ?? "";
            aInput.dataset.auto = "true";
        }
        if (invInput && invInput.dataset.auto !== "false") {
            const inv = record.f_inverse ?? (record.f ? 1 / record.f : "");
            invInput.value = inv ?? "";
            invInput.dataset.auto = "true";
        }
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
    }
    ensureInitialRows() {
        if (this.elements.commonBody && !this.elements.commonBody.children.length) {
            this.addCommonRow({});
            this.addCommonRow({});
        }
        if (this.elements.pointsBody && !this.elements.pointsBody.children.length) {
            this.addPointRow({});
            this.addPointRow({});
        }
    }



    clearCommonPoints() {
        if (!this.elements.commonBody) return;
        this.elements.commonBody.innerHTML = "";
        this.addCommonRow({});
    }

    clearPoints() {
        if (!this.elements.pointsBody) return;
        this.elements.pointsBody.innerHTML = "";
        this.addPointRow({});
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
        this.showMessages(messages || []);
    }

    populateCommonPoints(rows) {
        if (!this.elements.commonBody) return;
        this.elements.commonBody.innerHTML = "";
        if (!rows || !rows.length) {
            this.addCommonRow();
            return;
        }
        rows.forEach((row) => this.addCommonRow(row));
    }

    populatePoints(rows) {
        if (!this.elements.pointsBody) return;
        this.elements.pointsBody.innerHTML = "";
        if (!rows || !rows.length) {
            this.addPointRow();
            return;
        }
        rows.forEach((row) => this.addPointRow(row));
    }

    updateSevenParameters(data) {
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

    closeImportModal() {
        const modal = this.elements.importModal;
        if (modal) {
            modal.classList.remove("show");
            modal.style.display = "none";
        }
        this.resetImportModal();
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
                    
                    // 检查表格是否已有数据
                    const hasExistingData = this.elements.commonBody && this.elements.commonBody.children.length > 0;
                    
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
                    
                    // 检查表格是否已有数据
                    const hasExistingData = this.elements.pointsBody && this.elements.pointsBody.children.length > 0;
                    
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

    async requestExportFormat(title) {
        const choice = window.prompt(`${title}\n请输入导出格式（txt/csv），默认为 txt：`, "txt");
        if (!choice) return "txt";
        const normalized = choice.trim().toLowerCase();
        return normalized === "csv" ? "csv" : "txt";
    }

    async exportCommon() {
        const points = this.collectCommonPoints();
        if (!points.length) {
            this.showMessage("当前没有公共点数据。", "warning");
            return;
        }
        const format = await this.requestExportFormat("导出公共点数据");
        const separator = format === "txt" ? "\t" : ",";
        const header = [
            "点名",
            "B(°)",
            "L(°)",
            "H(m)",
            "X(m)",
            "Y(m)",
            "Z(m)",
            "x(m)",
            "y(m)",
            "h(m)",
            "B(°)",
            "L(°)",
            "H(m)",
            "X(m)",
            "Y(m)",
            "Z(m)",
            "x(m)",
            "y(m)",
            "h(m)",
        ];
        const lines = [this.formatDelimitedRow(header, separator)];
        points.forEach((point) => {
            const source = point.source || {};
            const target = point.target || {};
            lines.push(
                this.formatDelimitedRow(
                    [
                        point.name || "",
                        source.B ?? "",
                        source.L ?? "",
                        source.H ?? "",
                        source.X ?? "",
                        source.Y ?? "",
                        source.Z ?? "",
                        source.x ?? "",
                        source.y ?? "",
                        source.h ?? "",
                        target.B ?? "",
                        target.L ?? "",
                        target.H ?? "",
                        target.X ?? "",
                        target.Y ?? "",
                        target.Z ?? "",
                        target.x ?? "",
                        target.y ?? "",
                        target.h ?? "",
                    ],
                    separator,
                ),
            );
        });
        const filename = `common_points_${this.makeTimestamp()}.${format}`;
        const mime = format === "txt" ? "text/plain;charset=utf-8" : "text/csv;charset=utf-8";
        this.downloadTextFile(lines.join("\n"), filename, mime);
        this.showMessage(`公共点已导出为 ${format.toUpperCase()}。`, "success");
    }

    async exportPoints() {
        const points = this.collectPoints(false);
        if (!points.length) {
            this.showMessage("当前没有待转换点数据。", "warning");
            return;
        }
        const format = await this.requestExportFormat("导出待转换点数据");
        const separator = format === "txt" ? "\t" : ",";
        const header = ["点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", "x(m)", "y(m)", "h(m)"];
        const lines = [this.formatDelimitedRow(header, separator)];
        points.forEach((point) => {
            lines.push(
                this.formatDelimitedRow(
                    [
                        point.name ?? "",
                        point.B ?? "",
                        point.L ?? "",
                        point.H ?? "",
                        point.X ?? "",
                        point.Y ?? "",
                        point.Z ?? "",
                        point.x ?? "",
                        point.y ?? "",
                        point.h ?? "",
                    ],
                    separator,
                ),
            );
        });
        const filename = `pending_points_${this.makeTimestamp()}.${format}`;
        const mime = format === "txt" ? "text/plain;charset=utf-8" : "text/csv;charset=utf-8";
        this.downloadTextFile(lines.join("\n"), filename, mime);
        this.showMessage(`待转换点已导出为 ${format.toUpperCase()}。`, "success");
    }

    async exportResults() {
        if (!this.lastResults.length) {
            this.showMessage("当前没有可导出的转换结果。", "warning");
            return;
        }
        const format = await this.requestExportFormat("导出转换结果");
        const separator = format === "txt" ? "\t" : ",";
        const header = ["点名", "B(°)", "L(°)", "H(m)", "X(m)", "Y(m)", "Z(m)", "x(m)", "y(m)", "h(m)", "备注"];
        const lines = [this.formatDelimitedRow(header, separator)];
        this.lastResults.forEach((item) => {
            const target = item.target || {};
            lines.push(
                this.formatDelimitedRow(
                    [
                        item.name || "",
                        this.formatNumber(target.B, 8),
                        this.formatNumber(target.L, 8),
                        this.formatNumber(target.H, 3),
                        this.formatNumber(target.X, 3),
                        this.formatNumber(target.Y, 3),
                        this.formatNumber(target.Z, 3),
                        this.formatNumber(target.x, 3),
                        this.formatNumber(target.y, 3),
                        this.formatNumber(target.h, 3),
                        item.error || "",
                    ],
                    separator,
                ),
            );
        });
        const filename = `conversion_results_${this.makeTimestamp()}.${format}`;
        const mime = format === "txt" ? "text/plain;charset=utf-8" : "text/csv;charset=utf-8";
        this.downloadTextFile(lines.join("\n"), filename, mime);
        this.showMessage(`转换结果已导出为 ${format.toUpperCase()}。`, "success");
    }

    formatNumber(value, decimals) {
        if (value === null || value === undefined || value === "") return "";
        const num = Number(value);
        if (!Number.isFinite(num)) return value;
        return typeof decimals === "number" ? num.toFixed(decimals) : String(num);
    }

    downloadTextFile(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
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
            
            // 检查表格是否已有数据，以显示不同的成功消息
            let hasExistingData = false;
            switch (this.fieldMappingData.targetType) {
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
                // 检查表格是否已有数据
                let hasExistingData = false;
                switch (targetType) {
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
                if (pointName) {
                    existingPointMap.set(pointName, { row, index });
                }
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
                if (pointName) {
                    existingPointMap.set(pointName, { row, index });
                }
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

    // ʹ��ӳ�������ת��������
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

    // ʹ��ӳ������������
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
