"""
曲线测设模块 - 实现线性工程曲线测设计算
"""

import math
from typing import List, Dict, Tuple, Optional


class CurveDesign:
    """曲线测设计算类"""
    
    def __init__(self):
        pass
    
    def normalize_azimuth(self, azimuth: float) -> float:
        """
        规范化方位角到0-2π范围（工程测量学规范）
        
        Args:
            azimuth: 原始方位角（弧度）
            
        Returns:
            规范化后的方位角（0-2π）
        """
        # 使用模运算确保方位角在0-2π范围内，避免负数
        normalized = azimuth % (2 * math.pi)
        if normalized < 0:
            normalized += 2 * math.pi
        return normalized
    
    def calculate_azimuth(self, from_x: float, from_y: float, to_x: float, to_y: float) -> float:
        """
        计算坐标方位角（工程测量学规范）
        
        Args:
            from_x, from_y: 起点坐标
            to_x, to_y: 终点坐标
            
        Returns:
            方位角（弧度，0-2π）
        """
        # 检查点位重合
        if abs(to_x - from_x) < 0.001 and abs(to_y - from_y) < 0.001:
            return 0.0
        
        delta_x = to_x - from_x
        delta_y = to_y - from_y
        azimuth = math.atan2(delta_x, delta_y)
        
        # 确保方位角为0-2π的正数
        return self.normalize_azimuth(azimuth)
    
    def degrees_to_radians(self, degrees: float) -> float:
        """度转弧度"""
        return degrees * math.pi / 180.0
    
    def radians_to_degrees(self, radians: float) -> float:
        """弧度转度"""
        return radians * 180.0 / math.pi
    
    def dms_to_decimal(self, dms_str: str) -> float:
        """dd.mmsss格式转十进制度"""
        try:
            if isinstance(dms_str, (int, float)):
                return float(dms_str)
            
            if not isinstance(dms_str, str):
                return 0.0
            
            # 处理dd.mmsss格式
            parts = dms_str.split('.')
            if len(parts) != 2:
                return float(dms_str)
            
            degrees = int(parts[0]) if parts[0] else 0
            fractional_part = parts[1].ljust(5, '0')[:5]  # 确保5位：mmsss
            
            # 正确解析dd.mmsss格式：mm为分钟，sss为秒数（含小数）
            minutes = int(fractional_part[:2]) if len(fractional_part) >= 2 else 0
            seconds_str = fractional_part[2:5] if len(fractional_part) >= 5 else fractional_part[2:]
            seconds = float(seconds_str) / 10.0 if seconds_str else 0.0
            
            decimal = abs(degrees) + minutes / 60.0 + seconds / 3600.0
            return decimal if degrees >= 0 else -decimal
            
        except Exception as e:
            # 如果解析失败，尝试直接转换为浮点数
            try:
                return float(dms_str)
            except:
                return 0.0
    
    def decimal_to_dms(self, decimal: float) -> str:
        """十进制度转dd.mmsss格式"""
        if not isinstance(decimal, (int, float)) or math.isnan(decimal):
            return '0.00000'
        
        sign = '-' if decimal < 0 else ''
        abs_decimal = abs(decimal)
        
        degrees = int(abs_decimal)
        minutes_float = (abs_decimal - degrees) * 60
        minutes = int(minutes_float)
        seconds_float = (minutes_float - minutes) * 60
        
        # 四舍五入到0.1秒精度
        seconds = round(seconds_float * 10) / 10
        
        # 格式化为dd.mmsss
        seconds_int = int(seconds)
        seconds_frac = int(round((seconds - seconds_int) * 10))
        seconds_formatted = f"{seconds_int:02d}{seconds_frac}"
        
        return f"{sign}{degrees}.{minutes:02d}{seconds_formatted}"
    
    def transition_curve_design(self, params: Dict) -> Dict:
        """
        带缓和曲线的圆曲线测设
        
        Args:
            params: 曲线参数字典
                - alpha: 转向角(度)
                - R: 圆曲线半径(m)
                - l0: 缓和曲线长(m)
                - jd_mileage: JD里程(m)
                - x_jd: JD点X坐标(m)
                - y_jd: JD点Y坐标(m)
                - azimuth_in: 进入方位角(度)，可选
                - side_distance: 边距(m)，默认2.5
                - test_mileages: 待测里程列表
                
        Returns:
            计算结果字典
        """
        # 提取参数
        alpha_deg = params.get('alpha', 0)
        if isinstance(alpha_deg, str):
            alpha_deg = self.dms_to_decimal(alpha_deg)
        
        R = params.get('R', 1000)
        l0 = params.get('l0', 100)
        jd_mileage = params.get('jd_mileage', 0)
        x_jd = params.get('x_jd', 0)
        y_jd = params.get('y_jd', 0)
        azimuth_in = params.get('azimuth_in', 0)
        side_distance = params.get('side_distance', 2.5)
        test_mileages = params.get('test_mileages', [])
        
        # 转换为弧度
        alpha = self.degrees_to_radians(alpha_deg)
        
        # 计算曲线要素
        elements = self._calculate_curve_elements(alpha, R, l0)
        
        # 计算主点里程
        main_points_mileage = self._calculate_main_points_mileage(
            jd_mileage, elements
        )
        
        # 计算主点坐标
        main_points_coords = self._calculate_main_points_coordinates(
            x_jd, y_jd, azimuth_in, elements, alpha
        )
        
        # 计算测设点坐标
        design_points = self._calculate_design_points(
            main_points_mileage, main_points_coords, elements,
            test_mileages, side_distance, azimuth_in, alpha
        )
        
        return {
            'curve_type': 'transition',
            'input_params': params,
            'curve_elements': elements,
            'main_points_mileage': main_points_mileage,
            'main_points_coords': main_points_coords,
            'design_points': design_points,
            'accuracy_assessment': self._assess_accuracy(params)
        }
    
    def circular_curve_design(self, params: Dict) -> Dict:
        """
        无缓和曲线的圆曲线测设
        
        Args:
            params: 曲线参数字典
                
        Returns:
            计算结果字典
        """
        # 提取参数
        alpha_deg = params.get('alpha', 0)
        if isinstance(alpha_deg, str):
            alpha_deg = self.dms_to_decimal(alpha_deg)
        
        R = params.get('R', 1000)
        jd_mileage = params.get('jd_mileage', 0)
        x_jd = params.get('x_jd', 0)
        y_jd = params.get('y_jd', 0)
        azimuth_in = params.get('azimuth_in', 0)
        side_distance = params.get('side_distance', 2.5)
        test_mileages = params.get('test_mileages', [])
        
        # 转换为弧度
        alpha = self.degrees_to_radians(alpha_deg)
        
        # 计算曲线要素（无缓和曲线）
        elements = self._calculate_circular_elements(alpha, R)
        
        # 计算主点里程
        main_points_mileage = self._calculate_circular_main_points_mileage(
            jd_mileage, elements
        )
        
        # 计算主点坐标
        main_points_coords = self._calculate_circular_main_points_coordinates(
            x_jd, y_jd, azimuth_in, elements, alpha
        )
        
        # 计算测设点坐标
        design_points = self._calculate_circular_design_points(
            main_points_mileage, main_points_coords, elements,
            test_mileages, side_distance, azimuth_in, alpha
        )
        
        return {
            'curve_type': 'circular',
            'input_params': params,
            'curve_elements': elements,
            'main_points_mileage': main_points_mileage,
            'main_points_coords': main_points_coords,
            'design_points': design_points,
            'accuracy_assessment': self._assess_accuracy(params)
        }
    
    def _calculate_curve_elements(self, alpha: float, R: float, l0: float) -> Dict:
        """计算带缓和曲线的曲线要素"""
        # 缓和曲线参数
        A = math.sqrt(R * l0)  # 缓和曲线参数
        
        # 缓和曲线内移值
        p = l0**2 / (24 * R)
        
        # 缓和曲线切线增量
        q = l0 / 2 - l0**3 / (240 * R**2)
        
        # 圆曲线中央角
        beta0 = l0 / (2 * R)  # 缓和曲线对应的圆心角
        beta = alpha - 2 * beta0  # 圆曲线中央角
        
        # 切线长
        T = (R + p) * math.tan(alpha / 2) + q
        
        # 曲线长
        L = l0 + R * beta + l0  # 第一缓和曲线 + 圆曲线 + 第二缓和曲线
        
        # 外距
        E = (R + p) / math.cos(alpha / 2) - R
        
        # 切曲差
        J = 2 * T - L
        
        return {
            'alpha_deg': self.radians_to_degrees(alpha),
            'alpha_dms': self.decimal_to_dms(self.radians_to_degrees(alpha)),
            'R': R,
            'l0': l0,
            'A': A,
            'p': p,
            'q': q,
            'beta0_deg': self.radians_to_degrees(beta0),
            'beta_deg': self.radians_to_degrees(beta),
            'T': T,
            'L': L,
            'E': E,
            'J': J
        }
    
    def _calculate_circular_elements(self, alpha: float, R: float) -> Dict:
        """计算无缓和曲线的曲线要素"""
        # 切线长
        T = R * math.tan(alpha / 2)
        
        # 曲线长
        L = R * alpha
        
        # 外距
        E = R * (1 / math.cos(alpha / 2) - 1)
        
        # 切曲差
        J = 2 * T - L
        
        return {
            'alpha_deg': self.radians_to_degrees(alpha),
            'alpha_dms': self.decimal_to_dms(self.radians_to_degrees(alpha)),
            'R': R,
            'T': T,
            'L': L,
            'E': E,
            'J': J
        }
    
    def _calculate_main_points_mileage(self, jd_mileage: float, elements: Dict) -> Dict:
        """计算主点里程"""
        T = elements['T']
        L = elements['L']
        l0 = elements['l0']
        
        # 直缓点（ZH）
        zh_mileage = jd_mileage - T
        
        # 缓圆点（HY）
        hy_mileage = zh_mileage + l0
        
        # 圆缓点（YH）
        yh_mileage = hy_mileage + (L - 2 * l0)
        
        # 缓直点（HZ）
        hz_mileage = yh_mileage + l0
        
        return {
            'JD': jd_mileage,
            'ZH': zh_mileage,
            'HY': hy_mileage,
            'YH': yh_mileage,
            'HZ': hz_mileage
        }
    
    def _calculate_circular_main_points_mileage(self, jd_mileage: float, elements: Dict) -> Dict:
        """计算无缓和曲线主点里程"""
        T = elements['T']
        L = elements['L']
        
        # 直圆点（ZY）
        zy_mileage = jd_mileage - T
        
        # 圆直点（YZ）
        yz_mileage = zy_mileage + L
        
        return {
            'JD': jd_mileage,
            'ZY': zy_mileage,
            'YZ': yz_mileage
        }
    
    def _calculate_main_points_coordinates(self, x_jd: float, y_jd: float, 
                                         azimuth_in: float, elements: Dict, alpha: float) -> Dict:
        """计算主点坐标"""
        T = elements['T']
        p = elements['p']
        q = elements['q']
        R = elements['R']
        l0 = elements['l0']
        
        # 转换方位角为弧度
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        # ZH点坐标
        x_zh = x_jd - T * math.cos(azimuth_rad)
        y_zh = y_jd - T * math.sin(azimuth_rad)
        
        # HY点坐标（相对于ZH点）
        x_hy_rel = q
        y_hy_rel = p
        
        # 转换到绝对坐标系
        x_hy = x_zh + x_hy_rel * math.cos(azimuth_rad) - y_hy_rel * math.sin(azimuth_rad)
        y_hy = y_zh + x_hy_rel * math.sin(azimuth_rad) + y_hy_rel * math.cos(azimuth_rad)
        
        # 圆心坐标
        beta0 = l0 / (2 * R)
        azimuth_hy = azimuth_rad + beta0
        
        x_center = x_hy - R * math.sin(azimuth_hy)
        y_center = y_hy + R * math.cos(azimuth_hy)
        
        # YH点坐标
        azimuth_yh = azimuth_rad + alpha - beta0
        x_yh = x_center + R * math.sin(azimuth_yh)
        y_yh = y_center - R * math.cos(azimuth_yh)
        
        # HZ点坐标
        azimuth_out = azimuth_rad + alpha
        x_hz = x_yh + q * math.cos(azimuth_out) - p * math.sin(azimuth_out)
        y_hz = y_yh + q * math.sin(azimuth_out) + p * math.cos(azimuth_out)
        
        return {
            'JD': {'x': x_jd, 'y': y_jd},
            'ZH': {'x': x_zh, 'y': y_zh},
            'HY': {'x': x_hy, 'y': y_hy},
            'YH': {'x': x_yh, 'y': y_yh},
            'HZ': {'x': x_hz, 'y': y_hz},
            'Center': {'x': x_center, 'y': y_center}
        }
    
    def _calculate_circular_main_points_coordinates(self, x_jd: float, y_jd: float,
                                                  azimuth_in: float, elements: Dict, alpha: float) -> Dict:
        """计算无缓和曲线主点坐标"""
        T = elements['T']
        R = elements['R']
        
        # 转换方位角为弧度
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        # ZY点坐标
        x_zy = x_jd - T * math.cos(azimuth_rad)
        y_zy = y_jd - T * math.sin(azimuth_rad)
        
        # 圆心坐标
        x_center = x_zy - R * math.sin(azimuth_rad)
        y_center = y_zy + R * math.cos(azimuth_rad)
        
        # YZ点坐标
        azimuth_out = azimuth_rad + alpha
        x_yz = x_center + R * math.sin(azimuth_out)
        y_yz = y_center - R * math.cos(azimuth_out)
        
        return {
            'JD': {'x': x_jd, 'y': y_jd},
            'ZY': {'x': x_zy, 'y': y_zy},
            'YZ': {'x': x_yz, 'y': y_yz},
            'Center': {'x': x_center, 'y': y_center}
        }
    
    def _calculate_design_points(self, main_points_mileage: Dict, main_points_coords: Dict,
                               elements: Dict, test_mileages: List[float], side_distance: float,
                               azimuth_in: float, alpha: float) -> List[Dict]:
        """计算测设点坐标"""
        design_points = []
        
        R = elements['R']
        l0 = elements['l0']
        
        zh_mileage = main_points_mileage['ZH']
        hy_mileage = main_points_mileage['HY']
        yh_mileage = main_points_mileage['YH']
        hz_mileage = main_points_mileage['HZ']
        
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        for mileage in test_mileages:
            if isinstance(mileage, str):
                mileage = float(mileage)
            
            # 判断点位所在段落
            if mileage < zh_mileage or mileage > hz_mileage:
                # 直线段
                point_coords = self._calculate_straight_point(
                    mileage, main_points_mileage, main_points_coords, 
                    side_distance, azimuth_in, alpha
                )
            elif mileage <= hy_mileage:
                # 第一缓和曲线段
                point_coords = self._calculate_transition_point(
                    mileage, zh_mileage, main_points_coords['ZH'], 
                    R, l0, side_distance, azimuth_rad, True
                )
            elif mileage <= yh_mileage:
                # 圆曲线段
                point_coords = self._calculate_circular_point(
                    mileage, hy_mileage, main_points_coords['Center'],
                    R, side_distance, azimuth_rad, l0 / (2 * R)
                )
            else:
                # 第二缓和曲线段
                point_coords = self._calculate_transition_point(
                    mileage, hz_mileage, main_points_coords['HZ'],
                    R, l0, side_distance, azimuth_rad + alpha, False
                )
            
            design_points.append({
                'mileage': mileage,
                'center_x': point_coords['center']['x'],
                'center_y': point_coords['center']['y'],
                'left_x': point_coords['left']['x'],
                'left_y': point_coords['left']['y'],
                'right_x': point_coords['right']['x'],
                'right_y': point_coords['right']['y']
            })
        
        return design_points
    
    def _calculate_circular_design_points(self, main_points_mileage: Dict, main_points_coords: Dict,
                                        elements: Dict, test_mileages: List[float], side_distance: float,
                                        azimuth_in: float, alpha: float) -> List[Dict]:
        """计算无缓和曲线测设点坐标"""
        design_points = []
        
        R = elements['R']
        zy_mileage = main_points_mileage['ZY']
        yz_mileage = main_points_mileage['YZ']
        
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        for mileage in test_mileages:
            if isinstance(mileage, str):
                mileage = float(mileage)
            
            # 判断点位所在段落
            if mileage < zy_mileage or mileage > yz_mileage:
                # 直线段
                point_coords = self._calculate_straight_point_circular(
                    mileage, main_points_mileage, main_points_coords,
                    side_distance, azimuth_in, alpha
                )
            else:
                # 圆曲线段
                point_coords = self._calculate_circular_point_simple(
                    mileage, zy_mileage, main_points_coords['Center'],
                    R, side_distance, azimuth_rad
                )
            
            design_points.append({
                'mileage': mileage,
                'center_x': point_coords['center']['x'],
                'center_y': point_coords['center']['y'],
                'left_x': point_coords['left']['x'],
                'left_y': point_coords['left']['y'],
                'right_x': point_coords['right']['x'],
                'right_y': point_coords['right']['y']
            })
        
        return design_points
    
    def _calculate_straight_point(self, mileage: float, main_points_mileage: Dict,
                                main_points_coords: Dict, side_distance: float,
                                azimuth_in: float, alpha: float) -> Dict:
        """计算直线段点坐标"""
        # 简化实现，返回基本坐标
        zh_mileage = main_points_mileage['ZH']
        hz_mileage = main_points_mileage['HZ']
        
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        if mileage < zh_mileage:
            # ZH点前的直线段
            distance = zh_mileage - mileage
            x_center = main_points_coords['ZH']['x'] - distance * math.cos(azimuth_rad)
            y_center = main_points_coords['ZH']['y'] - distance * math.sin(azimuth_rad)
            normal_azimuth = azimuth_rad + math.pi / 2
        else:
            # HZ点后的直线段
            distance = mileage - hz_mileage
            azimuth_out = azimuth_rad + self.degrees_to_radians(alpha)
            x_center = main_points_coords['HZ']['x'] + distance * math.cos(azimuth_out)
            y_center = main_points_coords['HZ']['y'] + distance * math.sin(azimuth_out)
            normal_azimuth = azimuth_out + math.pi / 2
        
        # 计算左右边桩坐标
        x_left = x_center + side_distance * math.cos(normal_azimuth)
        y_left = y_center + side_distance * math.sin(normal_azimuth)
        x_right = x_center - side_distance * math.cos(normal_azimuth)
        y_right = y_center - side_distance * math.sin(normal_azimuth)
        
        return {
            'center': {'x': x_center, 'y': y_center},
            'left': {'x': x_left, 'y': y_left},
            'right': {'x': x_right, 'y': y_right}
        }
    
    def _calculate_straight_point_circular(self, mileage: float, main_points_mileage: Dict,
                                         main_points_coords: Dict, side_distance: float,
                                         azimuth_in: float, alpha: float) -> Dict:
        """计算无缓和曲线直线段点坐标"""
        zy_mileage = main_points_mileage['ZY']
        yz_mileage = main_points_mileage['YZ']
        
        azimuth_rad = self.degrees_to_radians(azimuth_in)
        
        if mileage < zy_mileage:
            # ZY点前的直线段
            distance = zy_mileage - mileage
            x_center = main_points_coords['ZY']['x'] - distance * math.cos(azimuth_rad)
            y_center = main_points_coords['ZY']['y'] - distance * math.sin(azimuth_rad)
            normal_azimuth = azimuth_rad + math.pi / 2
        else:
            # YZ点后的直线段
            distance = mileage - yz_mileage
            azimuth_out = azimuth_rad + self.degrees_to_radians(alpha)
            x_center = main_points_coords['YZ']['x'] + distance * math.cos(azimuth_out)
            y_center = main_points_coords['YZ']['y'] + distance * math.sin(azimuth_out)
            normal_azimuth = azimuth_out + math.pi / 2
        
        # 计算左右边桩坐标
        x_left = x_center + side_distance * math.cos(normal_azimuth)
        y_left = y_center + side_distance * math.sin(normal_azimuth)
        x_right = x_center - side_distance * math.cos(normal_azimuth)
        y_right = y_center - side_distance * math.sin(normal_azimuth)
        
        return {
            'center': {'x': x_center, 'y': y_center},
            'left': {'x': x_left, 'y': y_left},
            'right': {'x': x_right, 'y': y_right}
        }
    
    def _calculate_transition_point(self, mileage: float, start_mileage: float,
                                  start_coords: Dict, R: float, l0: float,
                                  side_distance: float, azimuth: float, is_first: bool) -> Dict:
        """计算缓和曲线段点坐标 - 修正版"""
        if is_first:
            distance = mileage - start_mileage
        else:
            distance = start_mileage - mileage
        
        l = distance
        l2 = l * l
        l3 = l2 * l
        l5 = l3 * l2
        l7 = l5 * l2
        
        R2 = R * R
        R3 = R2 * R
        l02 = l0 * l0
        l03 = l02 * l0
        
        # 标准缓和曲线参数方程 - 修正版
        # x = l - l⁵/(40R²l0²) + l⁹/(3456R⁴l0⁴) - 取前两项
        x_rel = l - l5 / (40 * R2 * l02)
        
        # y = l³/(6Rl0) - l⁷/(336R³l0³) + ... - 取前两项
        y_rel = l3 / (6 * R * l0) - l7 / (336 * R3 * l03)
        
        # 转换到绝对坐标系
        x_center = start_coords['x'] + x_rel * math.cos(azimuth) - y_rel * math.sin(azimuth)
        y_center = start_coords['y'] + x_rel * math.sin(azimuth) + y_rel * math.cos(azimuth)
        
        # 法线方向（规范化处理）
        tangent_azimuth = self.normalize_azimuth(azimuth + l2 / (2 * R * l0))
        normal_azimuth = self.normalize_azimuth(tangent_azimuth + math.pi / 2)
        
        # 计算左右边桩坐标
        x_left = x_center + side_distance * math.cos(normal_azimuth)
        y_left = y_center + side_distance * math.sin(normal_azimuth)
        x_right = x_center - side_distance * math.cos(normal_azimuth)
        y_right = y_center - side_distance * math.sin(normal_azimuth)
        
        return {
            'center': {'x': x_center, 'y': y_center},
            'left': {'x': x_left, 'y': y_left},
            'right': {'x': x_right, 'y': y_right}
        }
    
    def _calculate_circular_point(self, mileage: float, start_mileage: float,
                                center_coords: Dict, R: float, side_distance: float,
                                start_azimuth: float, beta0: float) -> Dict:
        """计算圆曲线段点坐标"""
        # 弧长
        arc_length = mileage - start_mileage
        
        # 圆心角
        central_angle = arc_length / R
        
        # 点在圆上的方位角（规范化处理）
        point_azimuth = self.normalize_azimuth(start_azimuth + beta0 + central_angle)
        
        # 中桩坐标
        x_center = center_coords['x'] + R * math.sin(point_azimuth)
        y_center = center_coords['y'] - R * math.cos(point_azimuth)
        
        # 法线方向（指向圆心的反方向）
        normal_azimuth = self.normalize_azimuth(point_azimuth + math.pi / 2)
        
        # 计算左右边桩坐标
        x_left = x_center + side_distance * math.cos(normal_azimuth)
        y_left = y_center + side_distance * math.sin(normal_azimuth)
        x_right = x_center - side_distance * math.cos(normal_azimuth)
        y_right = y_center - side_distance * math.sin(normal_azimuth)
        
        return {
            'center': {'x': x_center, 'y': y_center},
            'left': {'x': x_left, 'y': y_left},
            'right': {'x': x_right, 'y': y_right}
        }
    
    def _calculate_circular_point_simple(self, mileage: float, start_mileage: float,
                                       center_coords: Dict, R: float, side_distance: float,
                                       start_azimuth: float) -> Dict:
        """计算无缓和曲线圆曲线段点坐标"""
        # 弧长
        arc_length = mileage - start_mileage
        
        # 圆心角
        central_angle = arc_length / R
        
        # 点在圆上的方位角（规范化处理）
        point_azimuth = self.normalize_azimuth(start_azimuth + central_angle)
        
        # 中桩坐标
        x_center = center_coords['x'] + R * math.sin(point_azimuth)
        y_center = center_coords['y'] - R * math.cos(point_azimuth)
        
        # 法线方向
        normal_azimuth = self.normalize_azimuth(point_azimuth + math.pi / 2)
        
        # 计算左右边桩坐标
        x_left = x_center + side_distance * math.cos(normal_azimuth)
        y_left = y_center + side_distance * math.sin(normal_azimuth)
        x_right = x_center - side_distance * math.cos(normal_azimuth)
        y_right = y_center - side_distance * math.sin(normal_azimuth)
        
        return {
            'center': {'x': x_center, 'y': y_center},
            'left': {'x': x_left, 'y': y_left},
            'right': {'x': x_right, 'y': y_right}
        }
    
    def _assess_accuracy(self, params: Dict) -> Dict:
        """精度评定"""
        # 获取误差参数
        error_x = params.get('errorX', 0.05)  # 点位中误差mₓ
        error_y = params.get('errorY', 0.03)  # 点位中误差mᵧ
        
        # 计算综合点位中误差
        point_error = math.sqrt(error_x**2 + error_y**2)
        
        return {
            'point_error_x': error_x,
            'point_error_y': error_y,
            'point_error_total': point_error,
            'accuracy_grade': self._determine_accuracy_grade(point_error)
        }
    
    def _determine_accuracy_grade(self, error: float) -> str:
        """确定精度等级"""
        if error <= 0.05:
            return "一级精度"
        elif error <= 0.10:
            return "二级精度"
        elif error <= 0.15:
            return "三级精度"
        else:
            return "低精度"
    
    def compound_curve_design(self, params: Dict) -> Dict:
        """
        复曲线测设
        
        Args:
            params: 复曲线参数字典
                
        Returns:
            计算结果字典
        """
        # 复曲线设计（简化实现）
        # 实际应用中需要根据具体的复曲线类型进行详细计算
        
        return {
            'curve_type': 'compound',
            'input_params': params,
            'message': '复曲线测设功能正在开发中',
            'accuracy_assessment': self._assess_accuracy(params)
        }