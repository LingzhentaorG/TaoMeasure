/**
 * 曲线测设服务 - 对称基本型曲线测设算法
 * 实现精确的曲线计算，包括综合要素、主点坐标、中桩坐标、边桩坐标等
 */

class CurveDesignService {
    constructor() {
        this.PI = Math.PI;
        this.DEG_TO_RAD = this.PI / 180;
        this.RAD_TO_DEG = 180 / this.PI;
    }

    /**
     * 规范化方位角到0-2π范围（工程测量学规范）
     * @param {number} azimuth - 原始方位角（弧度）
     * @returns {number} 规范化后的方位角（0-2π）
     */
    normalizeAzimuth(azimuth) {
        // 使用模运算确保方位角在0-2π范围内
        let normalized = azimuth % (2 * this.PI);
        if (normalized < 0) normalized += 2 * this.PI;
        return normalized;
    }

    /**
     * 验证数值是否有效
     * @param {number} value - 要验证的数值
     * @returns {boolean} 是否有效
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    /**
     * 计算对称基本型曲线综合要素
     * @param {Object} params - 曲线参数
     * @returns {Object} 综合要素计算结果
     */
    calculateCurveElements(params) {
        try {
            const {
                deflectionAngle,  // 转角α(弧度)
                radius,          // 圆半径R
                transitionLength // 缓和曲线长Ls
            } = params;

            // 验证参数
            this.validateCurveParams(params);

            const R = radius;
            const Ls = transitionLength;
            const alpha = Math.abs(deflectionAngle);

            console.log('曲线要素计算输入参数:', { R, Ls, alpha, deflectionAngle });

            // 检查特殊情况
            if (R === 0) {
                throw new Error('圆曲线半径不能为零');
            }
            if (Ls < 0) {
                throw new Error('缓和曲线长度不能为负数');
            }
            if (alpha === 0) {
                throw new Error('转角不能为零');
            }
            if (alpha >= Math.PI) {
                throw new Error('转角过大（必须小于180度）');
            }

            // 计算缓和曲线参数
            const beta0 = Ls / (2 * R); // 缓和曲线总偏角（弧度）
            console.log('计算的beta0:', beta0);
            
            // 计算缓和曲线内移值和切线增量
            const p = Math.pow(Ls, 2) / (24 * R); // 内移值
            const q = Ls / 2 - Math.pow(Ls, 3) / (240 * Math.pow(R, 2)); // 切线增量
            console.log('计算的p和q:', { p, q });

            // 计算综合要素
            const tanAlphaHalf = Math.tan(alpha / 2);
            console.log('tan(alpha/2):', tanAlphaHalf);
            
            const T = q + (R + p) * tanAlphaHalf; // 切线长
            const Ly = R * (alpha - 2 * beta0); // 圆曲线长
            const L = 2 * Ls + Ly; // 总曲线长
            const cosAlphaHalf = Math.cos(alpha / 2);
            const E = (R + p) / cosAlphaHalf - R; // 外矢距
            const D = 2 * T - L; // 切曲差
            console.log('计算的综合要素:', { T, Ly, L, E, D });

            // 计算缓和曲线坐标参数
            const x0 = Ls - Math.pow(Ls, 3) / (40 * Math.pow(R, 2)); // 缓和曲线终点横坐标
            const y0 = Math.pow(Ls, 2) / (6 * R) - Math.pow(Ls, 4) / (336 * Math.pow(R, 3)); // 缓和曲线终点纵坐标
            console.log('计算的坐标参数:', { x0, y0 });

            // 验证计算结果的有效性
            const validationResults = {
                T: this.isValidNumber(T),
                L: this.isValidNumber(L),
                E: this.isValidNumber(E),
                D: this.isValidNumber(D),
                beta0: this.isValidNumber(beta0),
                Ly: this.isValidNumber(Ly),
                p: this.isValidNumber(p),
                q: this.isValidNumber(q),
                x0: this.isValidNumber(x0),
                y0: this.isValidNumber(y0)
            };
            
            const invalidParams = Object.entries(validationResults)
                .filter(([key, valid]) => !valid)
                .map(([key, valid]) => `${key}=${eval(key)}`);
                
            if (invalidParams.length > 0) {
                throw new Error(`曲线要素计算结果包含无效数值: ${invalidParams.join(', ')}，请检查输入参数`);
            }

            return {
                success: true,
                elements: {
                    T: T,           // 切线长
                    L: L,           // 总曲线长
                    Ly: Ly,         // 圆曲线长
                    E: E,           // 外矢距
                    D: D,           // 切曲差
                    beta0: beta0,   // 缓和曲线总偏角
                    p: p,           // 内移值
                    q: q,           // 切线增量
                    x0: x0,         // 缓和曲线终点横坐标
                    y0: y0,         // 缓和曲线终点纵坐标
                    R: R,           // 圆曲线半径
                    Ls: Ls,         // 缓和曲线长度
                    alpha: alpha    // 转角
                },
                params: {
                    R: R,
                    Ls: Ls,
                    alpha: alpha
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 计算主点坐标
     * @param {Object} curveElements - 曲线综合要素
     * @param {Object} params - 计算参数
     * @returns {Object} 主点坐标结果
     */
    calculateMainPointCoordinates(curveElements, params) {
        try {
            const {
                intersectionX,    // 交点X坐标
                intersectionY,    // 交点Y坐标
                startAzimuth,     // 起点方位角(弧度)
                deflectionDirection, // 偏向(1右偏, -1左偏)
                intersectionStation  // 交点桩号
            } = params;

            // 验证输入参数
            if (!curveElements || !curveElements.elements) {
                throw new Error('曲线要素数据不完整');
            }

            const { T, L, Ls, alpha, R, p, q, x0, y0 } = curveElements.elements;
            
            // 验证所有必需的曲线要素
            const elementValidation = {
                T: this.isValidNumber(T),
                L: this.isValidNumber(L),
                Ls: this.isValidNumber(Ls),
                alpha: this.isValidNumber(alpha),
                R: this.isValidNumber(R),
                p: this.isValidNumber(p),
                q: this.isValidNumber(q),
                x0: this.isValidNumber(x0),
                y0: this.isValidNumber(y0)
            };
            
            const invalidElements = Object.entries(elementValidation)
                .filter(([key, valid]) => !valid)
                .map(([key, valid]) => `${key}=${curveElements.elements[key]}`);
                
            if (invalidElements.length > 0) {
                throw new Error(`曲线要素数据包含无效数值: ${invalidElements.join(', ')}`);
            }

            if (!this.isValidNumber(intersectionX) || !this.isValidNumber(intersectionY)) {
                throw new Error('交点坐标无效');
            }

            if (!this.isValidNumber(startAzimuth)) {
                throw new Error('起点方位角无效');
            }

            if (!intersectionStation || intersectionStation.trim() === '') {
                throw new Error('交点桩号不能为空');
            }

            const cc = deflectionDirection;

            // 计算主点桩号
            const jdStation = this.parseStation(intersectionStation);
            const zhStation = jdStation - T;
            const hyStation = zhStation + Ls;
            const qzStation = zhStation + L / 2;
            const yhStation = hyStation + curveElements.elements.Ly;
            const hzStation = zhStation + L;

            // 计算ZH点坐标
            const zhX = intersectionX - T * Math.cos(startAzimuth);
            const zhY = intersectionY - T * Math.sin(startAzimuth);

            // 计算HZ点坐标
            const hzAzimuth = startAzimuth + cc * alpha;
            const hzX = intersectionX + T * Math.cos(hzAzimuth);
            const hzY = intersectionY + T * Math.sin(hzAzimuth);

            // 计算HY点坐标（第一缓和曲线终点）
            const hyLocalX = x0;
            const hyLocalY = cc * y0;
            const hyX = zhX + hyLocalX * Math.cos(startAzimuth) - hyLocalY * Math.sin(startAzimuth);
            const hyY = zhY + hyLocalX * Math.sin(startAzimuth) + hyLocalY * Math.cos(startAzimuth);
            const hyAzimuth = startAzimuth + cc * curveElements.elements.beta0;

            // 计算YH点坐标（第二缓和曲线起点）
            const yhLocalX = x0;
            const yhLocalY = cc * y0;
            const yhAzimuth = hzAzimuth - cc * curveElements.elements.beta0;
            const yhX = hzX - yhLocalX * Math.cos(hzAzimuth) + yhLocalY * Math.sin(hzAzimuth);
            const yhY = hzY - yhLocalX * Math.sin(hzAzimuth) - yhLocalY * Math.cos(hzAzimuth);

            // 计算QZ点坐标（曲中点）
            const qzAzimuth = startAzimuth + cc * alpha / 2;
            const qzRadius = R + p; // 考虑内移值
            const qzX = intersectionX - qzRadius * Math.cos(qzAzimuth + cc * this.PI / 2);
            const qzY = intersectionY - qzRadius * Math.sin(qzAzimuth + cc * this.PI / 2);

            const mainPoints = {
                ZH: {
                    name: 'ZH',
                    station: zhStation,
                    coordinates: { x: zhX, y: zhY, azimuth: startAzimuth }
                },
                HY: {
                    name: 'HY',
                    station: hyStation,
                    coordinates: { x: hyX, y: hyY, azimuth: hyAzimuth }
                },
                QZ: {
                    name: 'QZ',
                    station: qzStation,
                    coordinates: { x: qzX, y: qzY, azimuth: qzAzimuth }
                },
                YH: {
                    name: 'YH',
                    station: yhStation,
                    coordinates: { x: yhX, y: yhY, azimuth: yhAzimuth }
                },
                HZ: {
                    name: 'HZ',
                    station: hzStation,
                    coordinates: { x: hzX, y: hzY, azimuth: hzAzimuth }
                }
            };

            const refinementParams = {
                startAzimuth,
                deflectionDirection: cc
            };

            const hyRefined = this.calculateFirstTransitionCoordinates(hyStation, curveElements, mainPoints, refinementParams);
            if (hyRefined && this.isValidNumber(hyRefined.x) && this.isValidNumber(hyRefined.y)) {
                mainPoints.HY.coordinates = hyRefined;
            }

            const qzRefined = this.calculateCircularCoordinates(qzStation, curveElements, mainPoints, refinementParams);
            if (qzRefined && this.isValidNumber(qzRefined.x) && this.isValidNumber(qzRefined.y)) {
                mainPoints.QZ.coordinates = qzRefined;
            }

            const yhRefined = this.calculateSecondTransitionCoordinates(yhStation, curveElements, mainPoints, refinementParams);
            if (yhRefined && this.isValidNumber(yhRefined.x) && this.isValidNumber(yhRefined.y)) {
                mainPoints.YH.coordinates = yhRefined;
            }

            const hzRefined = this.calculateSecondTransitionCoordinates(hzStation, curveElements, mainPoints, refinementParams);
            if (hzRefined && this.isValidNumber(hzRefined.x) && this.isValidNumber(hzRefined.y)) {
                mainPoints.HZ.coordinates = hzRefined;
            }

            return {
                success: true,
                mainPoints: mainPoints
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 计算任意桩号的坐标
     * @param {number} station - 桩号
     * @param {Object} curveElements - 曲线综合要素
     * @param {Object} mainPoints - 主点坐标
     * @param {Object} params - 计算参数
     * @returns {Object} 桩号坐标结果
     */
    calculateStationCoordinates(station, curveElements, mainPoints, params) {
        try {
            const zhStation = mainPoints.ZH.station;
            const hyStation = mainPoints.HY.station;
            const yhStation = mainPoints.YH.station;
            const hzStation = mainPoints.HZ.station;

            const { R, Ls, alpha } = curveElements.elements;
            const { startAzimuth, deflectionDirection } = params;
            const cc = deflectionDirection;

            let coordinates;

            if (station < zhStation || station > hzStation) {
                // 直线段
                coordinates = this.calculateStraightLineCoordinates(station, mainPoints, params);
            } else if (station <= hyStation) {
                // 第一缓和曲线段
                coordinates = this.calculateFirstTransitionCoordinates(station, curveElements, mainPoints, params);
            } else if (station <= yhStation) {
                // 圆曲线段
                coordinates = this.calculateCircularCoordinates(station, curveElements, mainPoints, params);
            } else {
                // 第二缓和曲线段
                coordinates = this.calculateSecondTransitionCoordinates(station, curveElements, mainPoints, params);
            }

            return {
                success: true,
                coordinates: coordinates,
                segment: this.getCurveSegmentType(station, mainPoints)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 计算第一缓和曲线段坐标 - 修正版
     * 使用标准缓和曲线参数方程
     */
    calculateFirstTransitionCoordinates(station, curveElements, mainPoints, params) {
        const zhStation = mainPoints.ZH.station;
        const zhCoords = mainPoints.ZH.coordinates;
        const { R, Ls } = curveElements.elements;
        const { deflectionDirection } = params;
        const cc = deflectionDirection;

        const l = station - zhStation; // 从ZH点的距离
        
        // 标准缓和曲线参数方程
        const l2 = l * l;
        const l3 = l2 * l;
        const l5 = l3 * l2;
        const l7 = l5 * l2;
        const R2 = R * R;
        const R3 = R2 * R;
        const Ls2 = Ls * Ls;
        const Ls3 = Ls2 * Ls;
        
        // x = l - l⁵/(40R²Ls²) + l⁹/(3456R⁴Ls⁴) - 取前两项
        const x = l - l5 / (40 * R2 * Ls2);
        
        // y = l³/(6RLs) - l⁷/(336R³Ls³) + ... - 取前两项
        const y = cc * (l3 / (6 * R * Ls) - l7 / (336 * R3 * Ls3));
        
        const beta = cc * l * l / (2 * R * Ls); // 切线偏角（修正为正确公式）

        // 转换到大地坐标系
        const azimuth = this.normalizeAzimuth(zhCoords.azimuth + beta);
        const globalX = zhCoords.x + x * Math.cos(zhCoords.azimuth) - y * Math.sin(zhCoords.azimuth);
        const globalY = zhCoords.y + x * Math.sin(zhCoords.azimuth) + y * Math.cos(zhCoords.azimuth);

        return { x: globalX, y: globalY, azimuth: azimuth };
    }

    /**
     * 计算圆曲线段坐标
     */
    calculateCircularCoordinates(station, curveElements, mainPoints, params) {
        const hyStation = mainPoints.HY.station;
        const hyCoords = mainPoints.HY.coordinates;
        const { R, beta0 } = curveElements.elements;
        const { deflectionDirection } = params;
        const cc = deflectionDirection;

        const l = station - hyStation; // 从HY点的距离
        const phi = l / R; // 圆心角

        // 圆曲线参数方程（以HY为起点）
        const x = R * Math.sin(phi);
        const y = cc * R * (1 - Math.cos(phi));
        const beta = cc * phi; // 切线偏角

        // 转换到大地坐标系
        const azimuth = this.normalizeAzimuth(hyCoords.azimuth + beta);
        const globalX = hyCoords.x + x * Math.cos(hyCoords.azimuth) - y * Math.sin(hyCoords.azimuth);
        const globalY = hyCoords.y + x * Math.sin(hyCoords.azimuth) + y * Math.cos(hyCoords.azimuth);

        return { x: globalX, y: globalY, azimuth: azimuth };
    }

    /**
     * 计算第二缓和曲线段坐标 - 修正版
     * 使用标准缓和曲线参数方程
     */
    calculateSecondTransitionCoordinates(station, curveElements, mainPoints, params) {
        const yhStation = mainPoints.YH.station;
        const hzStation = mainPoints.HZ.station;
        const hzCoords = mainPoints.HZ.coordinates;
        const { R, Ls } = curveElements.elements;
        const { deflectionDirection } = params;
        const cc = deflectionDirection;

        const l = hzStation - station; // 从HZ点的反向距离
        
        // 标准缓和曲线参数方程（反向计算）
        const l2 = l * l;
        const l3 = l2 * l;
        const l5 = l3 * l2;
        const l7 = l5 * l2;
        const R2 = R * R;
        const R3 = R2 * R;
        const Ls2 = Ls * Ls;
        const Ls3 = Ls2 * Ls;
        
        // x = l - l⁵/(40R²Ls²) + l⁹/(3456R⁴Ls⁴) - 取前两项
        const x = l - l5 / (40 * R2 * Ls2);
        
        // y = l³/(6RLs) - l⁷/(336R³Ls³) + ... - 取前两项
        const y = cc * (l3 / (6 * R * Ls) - l7 / (336 * R3 * Ls3));
        
        const beta = cc * l * l / (2 * R * Ls); // 切线偏角（修正为正确公式）

        // 转换到大地坐标系（从HZ点反向）
        const azimuth = this.normalizeAzimuth(hzCoords.azimuth - beta);
        const globalX = hzCoords.x - x * Math.cos(hzCoords.azimuth) - y * Math.sin(hzCoords.azimuth);
        const globalY = hzCoords.y - x * Math.sin(hzCoords.azimuth) + y * Math.cos(hzCoords.azimuth);

        return { x: globalX, y: globalY, azimuth: azimuth };
    }

    /**
     * 计算直线段坐标
     */
    calculateStraightLineCoordinates(station, mainPoints, params) {
        const zhStation = mainPoints.ZH.station;
        const hzStation = mainPoints.HZ.station;
        const zhCoords = mainPoints.ZH.coordinates;
        const hzCoords = mainPoints.HZ.coordinates;

        if (station < zhStation) {
            // ZH前的直线段
            const distance = zhStation - station;
            const azimuth = zhCoords.azimuth;
            const x = zhCoords.x - distance * Math.cos(azimuth);
            const y = zhCoords.y - distance * Math.sin(azimuth);
            return { x: x, y: y, azimuth: azimuth };
        } else {
            // HZ后的直线段
            const distance = station - hzStation;
            const azimuth = hzCoords.azimuth;
            const x = hzCoords.x + distance * Math.cos(azimuth);
            const y = hzCoords.y + distance * Math.sin(azimuth);
            return { x: x, y: y, azimuth: azimuth };
        }
    }

    /**
     * 计算边桩坐标
     * @param {Object} centerCoords - 中桩坐标
     * @param {number} distance - 边距
     * @param {boolean} isLeft - 是否为左边桩
     * @returns {Object} 边桩坐标
     */
    calculateSideStakeCoordinates(centerCoords, distance, isLeft) {
        const { x, y, azimuth } = centerCoords;
        
        // 计算垂直方向的方位角（规范化处理）
        const perpAzimuth = this.normalizeAzimuth(azimuth + (isLeft ? this.PI / 2 : -this.PI / 2));
        
        // 计算边桩坐标
        const sideX = x + distance * Math.cos(perpAzimuth);
        const sideY = y + distance * Math.sin(perpAzimuth);
        
        return { x: sideX, y: sideY, azimuth: azimuth };
    }

    /**
     * 计算极坐标放样元素
     * 根据坐标方位角计算.md文档修正：
     * 1. 方位角：设站到放样点的连线的坐标方位角
     * 2. 水平角：设站-后视点射线与设站-放样点射线的夹角
     * 3. 确保所有角度为0-360度的正数
     * 4. 使用统一的角度处理工具
     */
    calculatePolarLayoutElements(targetCoords, stationCoords, backsightAzimuth) {
        if (typeof window !== 'undefined' && window.angleUtils) {
            return window.angleUtils.calculatePolarLayoutElements(targetCoords, stationCoords, backsightAzimuth);
        }
        
        // 备用实现
        const { x: targetX, y: targetY } = targetCoords;
        const { x: stationX, y: stationY } = stationCoords;

        // 检查重合点
        const deltaX = targetX - stationX;
        const deltaY = targetY - stationY;
        if (Math.abs(deltaX) < 1e-10 && Math.abs(deltaY) < 1e-10) {
            return {
                azimuth: 0,
                horizontalAngle: 0,
                distance: 0
            };
        }

        // 计算目标方位角（设站到放样点的坐标方位角）
        const targetAzimuth = this.calculateAzimuth(stationX, stationY, targetX, targetY);

        // 计算水平角（设站-后视点射线与设站-放样点射线的夹角）
        // 水平角 = 目标方位角 - 后视方位角
        let horizontalAngle = this.normalizeAzimuth(targetAzimuth - backsightAzimuth);

        // 计算距离
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        return {
            azimuth: targetAzimuth, // 弧度
            horizontalAngle: horizontalAngle, // 弧度
            distance: distance
        };
    }

    /**
     * 生成桩号序列
     * @param {Object} mainPoints - 主点坐标
     * @param {number} interval - 桩号间隔
     * @param {string} method - 递增方式
     * @returns {Array} 桩号序列
     */
    generateStationSequence(mainPoints, interval, method) {
        const zhStation = mainPoints.ZH.station;
        const hzStation = mainPoints.HZ.station;
        const stations = [];

        if (method === 'whole') {
            // 整桩号方式
            const startKm = Math.floor(zhStation / 1000);
            const endKm = Math.floor(hzStation / 1000);

            for (let km = startKm; km <= endKm; km++) {
                for (let m = 0; m < 1000; m += interval) {
                    const station = km * 1000 + m;
                    if (station >= zhStation && station <= hzStation) {
                        stations.push(station);
                    }
                }
            }
        } else {
            // 起点递增方式
            for (let station = zhStation; station <= hzStation; station += interval) {
                stations.push(station);
            }
        }

        // 确保包含所有主点
        Object.values(mainPoints).forEach(point => {
            if (!stations.some(s => Math.abs(s - point.station) < 0.001)) {
                stations.push(point.station);
            }
        });

        return stations.sort((a, b) => a - b);
    }

    /**
     * 获取曲线段类型
     */
    getCurveSegmentType(station, mainPoints) {
        const zhStation = mainPoints.ZH.station;
        const hyStation = mainPoints.HY.station;
        const yhStation = mainPoints.YH.station;
        const hzStation = mainPoints.HZ.station;

        if (station < zhStation) return '直线段';
        if (station <= hyStation) return '第一缓和曲线';
        if (station <= yhStation) return '圆曲线';
        if (station <= hzStation) return '第二缓和曲线';
        return '直线段';
    }

    /**
     * 验证曲线参数
     */
    validateCurveParams(params) {
        const { deflectionAngle, radius, transitionLength } = params;

        if (!this.isValidNumber(deflectionAngle)) {
            throw new Error('转角参数无效：必须为有效数值');
        }

        if (Math.abs(deflectionAngle) > this.PI) {
            throw new Error(`转角参数无效：${Math.abs(deflectionAngle) * this.RAD_TO_DEG}°超出范围（必须≤180°）`);
        }

        if (Math.abs(deflectionAngle) < 0.001) {
            throw new Error('转角参数无效：转角不能为零');
        }

        if (!this.isValidNumber(radius) || radius <= 0) {
            throw new Error(`圆半径无效：${radius}（必须>0）`);
        }

        if (!this.isValidNumber(transitionLength) || transitionLength < 0) {
            throw new Error(`缓和曲线长度无效：${transitionLength}（必须≥0）`);
        }

        // 检查缓和曲线长度与半径的关系
        const maxTransitionLength = radius * Math.abs(deflectionAngle) / 2;
        if (transitionLength > maxTransitionLength) {
            throw new Error(`缓和曲线长度过大：${transitionLength} > ${maxTransitionLength}，可能导致曲线重叠`);
        }

        // 检查半径的合理性（避免过大或过小）
        if (radius < 10) {
            throw new Error(`圆半径过小：${radius}m（建议≥10m）`);
        }
        if (radius > 10000) {
            throw new Error(`圆半径过大：${radius}m（建议≤10000m）`);
        }
    }

    /**
     * 解析桩号字符串
     */
    parseStation(stationStr) {
        if (typeof stationStr === 'number') return stationStr;
        if (typeof stationStr !== 'string') return 0;

        // 处理 K1+462.918 格式
        const match = stationStr.match(/K?(\d+)\+?(\d+\.?\d*)/);
        if (match) {
            const km = parseInt(match[1]) || 0;
            const m = parseFloat(match[2]) || 0;
            return km * 1000 + m;
        }

        return parseFloat(stationStr) || 0;
    }

    /**
     * 格式化桩号显示
     */
    formatStation(station) {
        const km = Math.floor(station / 1000);
        const m = station % 1000;
        return `K${km}+${m.toFixed(3)}`;
    }

    /**
     * 角度格式转换：dd.mmsss → 弧度
     * 修复：使用统一的角度处理工具
     */
    dmsToRadians(dmsStr) {
        if (typeof window !== 'undefined' && window.angleUtils) {
            return window.angleUtils.dmsToRadians(dmsStr);
        }
        
        // 备用实现
        if (typeof dmsStr === 'number') return dmsStr * this.DEG_TO_RAD;
        if (typeof dmsStr !== 'string') return 0;

        const parts = dmsStr.split('.');
        if (parts.length !== 2) return parseFloat(dmsStr) * this.DEG_TO_RAD || 0;

        const degrees = parseInt(parts[0]) || 0;
        const fractionalPart = parts[1].padEnd(5, '0');
        
        // 正确解析dd.mmsss格式
        const minutes = parseInt(fractionalPart.substr(0, 2)) || 0;
        const secondsStr = fractionalPart.substr(2, 3);
        const seconds = parseFloat(secondsStr) / 10;
        
        const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
        const result = degrees < 0 ? -decimal : decimal;
        return result * this.DEG_TO_RAD;
    }

    /**
     * 弧度 → dd.mmsss格式
     * 修复：使用统一的角度处理工具，确保格式为DD.MMSSS
     */
    radiansToDms(radians) {
        if (typeof window !== 'undefined' && window.angleUtils) {
            return window.angleUtils.radiansToDms(radians);
        }
        
        // 备用实现
        const decimal = Math.abs(radians) * this.RAD_TO_DEG;
        const degrees = Math.floor(decimal);
        const minutesFloat = (decimal - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const secondsFloat = (minutesFloat - minutes) * 60;
        
        // 四舍五入到0.1秒精度
        const seconds = Math.round(secondsFloat * 10) / 10;
        const sign = radians < 0 ? '-' : '';
        
        // 格式化为dd.mmsss
        const secondsInt = Math.floor(seconds);
        const secondsFrac = Math.round((seconds - secondsInt) * 10);
        const secondsFormatted = secondsInt.toString().padStart(2, '0') + secondsFrac.toString();

        return `${sign}${degrees}.${minutes.toString().padStart(2, '0')}${secondsFormatted}`;
    }

    /**
     * 计算方位角 - 工程测量学规范版本
     * 根据坐标方位角计算.md文档修正：
     * 1. 参数顺序：Math.atan2(Δy, Δx)
     * 2. 方位角为0-2π的正数
     * 3. 正确处理各象限
     */
    calculateAzimuth(fromX, fromY, toX, toY) {
        // 检查点位重合
        if (Math.abs(toX - fromX) < 0.001 && Math.abs(toY - fromY) < 0.001) {
            return 0;
        }
        
        const deltaX = toX - fromX; // 北方向差值
        const deltaY = toY - fromY; // 东方向差值
        
        // 特殊情况处理：沿坐标轴方向
        if (Math.abs(deltaY) < 0.001) {
            // 南北方向
            return deltaX > 0 ? 0 : this.PI;
        }
        if (Math.abs(deltaX) < 0.001) {
            // 东西方向
            return deltaY > 0 ? this.PI / 2 : 3 * this.PI / 2;
        }
        
        // 使用atan2计算方位角，参数顺序：Math.atan2(Δy, Δx)
        let azimuth = Math.atan2(deltaY, deltaX);
        
        // 工程测量学规范：方位角必须为0-2π的正数
        // 使用模运算确保结果始终在0-2π范围内，避免负数
        azimuth = ((azimuth % (2 * this.PI)) + (2 * this.PI)) % (2 * this.PI);
        
        return azimuth;
    }
}

// 导出服务类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CurveDesignService;
} else if (typeof window !== 'undefined') {
    window.CurveDesignService = CurveDesignService;
}