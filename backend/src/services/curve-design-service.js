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

            // 计算缓和曲线参数
            const beta0 = Ls / (2 * R); // 缓和曲线总偏角（弧度）
            
            // 计算缓和曲线内移值和切线增量
            const p = Math.pow(Ls, 2) / (24 * R); // 内移值
            const q = Ls / 2 - Math.pow(Ls, 3) / (240 * Math.pow(R, 2)); // 切线增量

            // 计算综合要素
            const T = q + (R + p) * Math.tan(alpha / 2); // 切线长
            const Ly = R * (alpha - 2 * beta0); // 圆曲线长
            const L = 2 * Ls + Ly; // 总曲线长
            const E = (R + p) / Math.cos(alpha / 2) - R; // 外矢距
            const D = 2 * T - L; // 切曲差

            // 计算缓和曲线坐标参数
            const x0 = Ls - Math.pow(Ls, 3) / (40 * Math.pow(R, 2)); // 缓和曲线终点横坐标
            const y0 = Math.pow(Ls, 2) / (6 * R) - Math.pow(Ls, 4) / (336 * Math.pow(R, 3)); // 缓和曲线终点纵坐标

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
                    y0: y0          // 缓和曲线终点纵坐标
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

            const { T, L, Ls, alpha, R, p, q, x0, y0 } = curveElements.elements;
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
     * 计算第一缓和曲线段坐标
     */
    calculateFirstTransitionCoordinates(station, curveElements, mainPoints, params) {
        const zhStation = mainPoints.ZH.station;
        const zhCoords = mainPoints.ZH.coordinates;
        const { R, Ls } = curveElements.elements;
        const { deflectionDirection } = params;
        const cc = deflectionDirection;

        const l = station - zhStation; // 从ZH点的距离
        
        // 缓和曲线参数方程
        const x = l - Math.pow(l, 3) / (40 * Math.pow(R, 2));
        const y = cc * (Math.pow(l, 2) / (6 * R) - Math.pow(l, 4) / (336 * Math.pow(R, 3)));
        const beta = cc * l / (2 * R); // 切线偏角

        // 转换到大地坐标系
        const azimuth = zhCoords.azimuth + beta;
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
        const azimuth = hyCoords.azimuth + beta;
        const globalX = hyCoords.x + x * Math.cos(hyCoords.azimuth) - y * Math.sin(hyCoords.azimuth);
        const globalY = hyCoords.y + x * Math.sin(hyCoords.azimuth) + y * Math.cos(hyCoords.azimuth);

        return { x: globalX, y: globalY, azimuth: azimuth };
    }

    /**
     * 计算第二缓和曲线段坐标
     */
    calculateSecondTransitionCoordinates(station, curveElements, mainPoints, params) {
        const yhStation = mainPoints.YH.station;
        const hzStation = mainPoints.HZ.station;
        const hzCoords = mainPoints.HZ.coordinates;
        const { R, Ls } = curveElements.elements;
        const { deflectionDirection } = params;
        const cc = deflectionDirection;

        const l = hzStation - station; // 从HZ点的反向距离
        
        // 缓和曲线参数方程（反向计算）
        const x = l - Math.pow(l, 3) / (40 * Math.pow(R, 2));
        const y = cc * (Math.pow(l, 2) / (6 * R) - Math.pow(l, 4) / (336 * Math.pow(R, 3)));
        const beta = cc * l / (2 * R); // 切线偏角

        // 转换到大地坐标系（从HZ点反向）
        const azimuth = hzCoords.azimuth - beta;
        const globalX = hzCoords.x - x * Math.cos(hzCoords.azimuth) + y * Math.sin(hzCoords.azimuth);
        const globalY = hzCoords.y - x * Math.sin(hzCoords.azimuth) - y * Math.cos(hzCoords.azimuth);

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
        
        // 计算垂直方向的方位角
        const perpAzimuth = azimuth + (isLeft ? this.PI / 2 : -this.PI / 2);
        
        // 计算边桩坐标
        const sideX = x + distance * Math.cos(perpAzimuth);
        const sideY = y + distance * Math.sin(perpAzimuth);
        
        return { x: sideX, y: sideY, azimuth: azimuth };
    }

    /**
     * 计算极坐标放样元素
     * @param {Object} targetCoords - 目标点坐标
     * @param {Object} stationCoords - 设站点坐标
     * @param {number} backsightAzimuth - 后视方位角
     * @returns {Object} 放样元素
     */
    calculatePolarLayoutElements(targetCoords, stationCoords, backsightAzimuth) {
        const { x: targetX, y: targetY } = targetCoords;
        const { x: stationX, y: stationY } = stationCoords;

        // 计算目标方位角
        const deltaX = targetX - stationX;
        const deltaY = targetY - stationY;
        const targetAzimuth = Math.atan2(deltaX, deltaY);

        // 计算水平角
        let horizontalAngle = targetAzimuth - backsightAzimuth;
        if (horizontalAngle < 0) horizontalAngle += 2 * this.PI;
        if (horizontalAngle > 2 * this.PI) horizontalAngle -= 2 * this.PI;

        // 计算距离
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        return {
            azimuth: targetAzimuth,
            horizontalAngle: horizontalAngle,
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

        if (!deflectionAngle || Math.abs(deflectionAngle) > this.PI) {
            throw new Error('转角参数无效，应在-180°到180°之间');
        }

        if (!radius || radius <= 0) {
            throw new Error('圆半径必须大于0');
        }

        if (!transitionLength || transitionLength <= 0) {
            throw new Error('缓和曲线长必须大于0');
        }

        // 检查缓和曲线长度与半径的关系
        if (transitionLength > radius * Math.abs(deflectionAngle)) {
            throw new Error('缓和曲线长度过大，可能导致曲线重叠');
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
     * dd.mmsss格式转弧度
     */
    dmsToRadians(dmsStr) {
        if (typeof dmsStr === 'number') return dmsStr * this.DEG_TO_RAD;
        if (typeof dmsStr !== 'string') return 0;

        const parts = dmsStr.split('.');
        if (parts.length !== 2) return parseFloat(dmsStr) * this.DEG_TO_RAD || 0;

        const degrees = parseInt(parts[0]) || 0;
        const fractionalPart = parts[1].padEnd(5, '0'); // 确保至少5位：mmsss
        
        // 正确解析dd.mmsss格式：mm为分钟，sss为秒数（含小数）
        const minutes = parseInt(fractionalPart.substr(0, 2)) || 0;
        const secondsStr = fractionalPart.substr(2, 3); // 取3位秒数
        const seconds = parseFloat(secondsStr) / 10; // 除以10得到实际秒数

        const decimal = Math.abs(degrees) + minutes / 60 + seconds / 3600;
        const result = degrees < 0 ? -decimal : decimal;
        return result * this.DEG_TO_RAD;
    }

    /**
     * 弧度转dd.mmsss格式
     */
    radiansToDms(radians) {
        if (typeof radians !== 'number' || isNaN(radians)) return '0.00000';

        const decimal = Math.abs(radians) * this.RAD_TO_DEG;
        const sign = radians < 0 ? '-' : '';
        
        const degrees = Math.floor(decimal);
        const minutesFloat = (decimal - degrees) * 60;
        const minutes = Math.floor(minutesFloat);
        const secondsFloat = (minutesFloat - minutes) * 60;
        
        // 四舍五入到0.1秒精度
        const seconds = Math.round(secondsFloat * 10) / 10;
        
        // 格式化为dd.mmsss
        const secondsInt = Math.floor(seconds);
        const secondsFrac = Math.round((seconds - secondsInt) * 10);
        const secondsFormatted = secondsInt.toString().padStart(2, '0') + secondsFrac.toString();

        return `${sign}${degrees}.${minutes.toString().padStart(2, '0')}${secondsFormatted}`;
    }

    /**
     * 计算方位角 - 工程测量学规范版本
     * 确保方位角始终为0-360度的正数，符合工程测量学要求
     */
    calculateAzimuth(fromX, fromY, toX, toY) {
        // 检查点位重合
        if (Math.abs(toX - fromX) < 0.001 && Math.abs(toY - fromY) < 0.001) {
            return 0;
        }
        
        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        let azimuth = Math.atan2(deltaX, deltaY);
        
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