"""
坐标转换模块 - 实现各种坐标系统间的转换计算
"""

import math
import numpy as np
from typing import Any


class CoordinateTransform:
    """坐标转换计算类"""
    
    def __init__(self):
        # 椭球参数 (WGS84)
        self.a = 6378137.0  # 长半轴
        self.f = 1 / 298.257223563  # 扁率
        self.b = self.a * (1 - self.f)  # 短半轴
        self.e2 = 2 * self.f - self.f ** 2  # 第一偏心率平方
        self.ep2 = self.e2 / (1 - self.e2)  # 第二偏心率平方
        
        # 其他椭球参数
        self.ellipsoids = {
            'WGS84': {'a': 6378137.0, 'f': 1/298.257223563},
            'CGCS2000': {'a': 6378137.0, 'f': 1/298.257222101},
            'Beijing54': {'a': 6378245.0, 'f': 1/298.3},
            'Xian80': {'a': 6378140.0, 'f': 1/298.257}
        }
    
    def set_ellipsoid(self, ellipsoid_name: str):
        """设置椭球参数"""
        if ellipsoid_name in self.ellipsoids:
            params = self.ellipsoids[ellipsoid_name]
            self.a = params['a']
            self.f = params['f']
            self.b = self.a * (1 - self.f)
            self.e2 = 2 * self.f - self.f ** 2
            self.ep2 = self.e2 / (1 - self.e2)
    
    def degrees_to_radians(self, degrees: float) -> float:
        """度转弧度"""
        return degrees * math.pi / 180.0
    
    def radians_to_degrees(self, radians: float) -> float:
        """弧度转度"""
        return radians * 180.0 / math.pi
    
    def dms_to_decimal(self, dms_str: str) -> float:
        """度分秒转十进制度"""
        try:
            # 解析度分秒格式：39°54′15.12″
            dms_str = dms_str.replace('°', ' ').replace('′', ' ').replace('″', ' ')
            parts = dms_str.split()
            
            degrees = float(parts[0])
            minutes = float(parts[1]) if len(parts) > 1 else 0
            seconds = float(parts[2]) if len(parts) > 2 else 0
            
            decimal = degrees + minutes/60.0 + seconds/3600.0
            return decimal
        except:
            return float(dms_str)  # 如果解析失败，尝试直接转换为浮点数
    
    def decimal_to_dms(self, decimal: float) -> str:
        """十进制度转度分秒"""
        degrees = int(decimal)
        minutes_float = (decimal - degrees) * 60
        minutes = int(minutes_float)
        seconds = (minutes_float - minutes) * 60
        
        return f"{degrees}°{minutes:02d}′{seconds:06.3f}″"
    
    def gauss_forward(self, lat: float, lon: float, central_meridian: float = 0, 
                     projection_height: float = 0, add_500km: bool = True) -> Tuple[float, float]:
        """
        高斯投影正算：大地坐标(B,L) -> 高斯平面坐标(x,y)
        
        Args:
            lat: 纬度(度)
            lon: 经度(度)
            central_meridian: 中央子午线(度)
            projection_height: 投影面大地高(米)
            add_500km: 是否加500km
            
        Returns:
            (x, y): 高斯平面坐标
        """
        # 转换为弧度
        B = self.degrees_to_radians(lat)
        L = self.degrees_to_radians(lon)
        L0 = self.degrees_to_radians(central_meridian)
        
        # 经差
        l = L - L0
        
        # 计算辅助量
        sin_B = math.sin(B)
        cos_B = math.cos(B)
        tan_B = math.tan(B)
        
        # 卯酉圈曲率半径
        N = self.a / math.sqrt(1 - self.e2 * sin_B**2)
        
        # 子午圈曲率半径
        M = self.a * (1 - self.e2) / (1 - self.e2 * sin_B**2)**(3/2)
        
        # 辅助计算
        eta2 = self.ep2 * cos_B**2
        t = tan_B
        
        # 高斯投影公式
        x = self.a * (
            self._meridian_arc_length(B) +
            N * sin_B * cos_B * l**2 / 2 * (
                1 + l**2 * cos_B**2 / 12 * (5 - t**2 + 9*eta2 + 4*eta2**2) +
                l**4 * cos_B**4 / 360 * (61 - 58*t**2 + t**4)
            )
        )
        
        y = N * cos_B * l * (
            1 + l**2 * cos_B**2 / 6 * (1 - t**2 + eta2) +
            l**4 * cos_B**4 / 120 * (5 - 18*t**2 + t**4 + 14*eta2 - 58*eta2*t**2)
        )
        
        # 投影面大地高改正
        if projection_height != 0:
            scale_factor = 1 + projection_height / (self.a + projection_height)
            x *= scale_factor
            y *= scale_factor
        
        # 加500km
        if add_500km:
            y += 500000
        
        return x, y
    
    def gauss_inverse(self, x: float, y: float, central_meridian: float = 0,
                     projection_height: float = 0, add_500km: bool = True) -> Tuple[float, float]:
        """
        高斯投影反算：高斯平面坐标(x,y) -> 大地坐标(B,L)
        
        Args:
            x: 高斯x坐标(米)
            y: 高斯y坐标(米)
            central_meridian: 中央子午线(度)
            projection_height: 投影面大地高(米)
            add_500km: 是否减去500km
            
        Returns:
            (lat, lon): 大地坐标(度)
        """
        # 减去500km
        if add_500km:
            y -= 500000
        
        # 投影面大地高改正
        if projection_height != 0:
            scale_factor = 1 + projection_height / (self.a + projection_height)
            x /= scale_factor
            y /= scale_factor
        
        # 底点纬度迭代计算
        Bf = self._foot_point_latitude(x)
        
        # 计算辅助量
        sin_Bf = math.sin(Bf)
        cos_Bf = math.cos(Bf)
        tan_Bf = math.tan(Bf)
        
        # 卯酉圈曲率半径
        Nf = self.a / math.sqrt(1 - self.e2 * sin_Bf**2)
        
        # 子午圈曲率半径
        Mf = self.a * (1 - self.e2) / (1 - self.e2 * sin_Bf**2)**(3/2)
        
        # 辅助计算
        eta2f = self.ep2 * cos_Bf**2
        tf = tan_Bf
        
        # 反算公式
        B = Bf - (Nf * tan_Bf / Mf) * (y**2 / (2 * Nf**2)) * (
            1 - y**2 / (12 * Nf**2) * (5 + 3*tf**2 + eta2f - 9*eta2f*tf**2) +
            y**4 / (360 * Nf**4) * (61 + 90*tf**2 + 45*tf**4)
        )
        
        l = (y / (Nf * cos_Bf)) * (
            1 - y**2 / (6 * Nf**2) * (1 + 2*tf**2 + eta2f) +
            y**4 / (120 * Nf**4) * (5 + 28*tf**2 + 24*tf**4 + 6*eta2f + 8*eta2f*tf**2)
        )
        
        # 转换为度
        lat = self.radians_to_degrees(B)
        lon = self.radians_to_degrees(l) + central_meridian
        
        return lat, lon
    
    def _meridian_arc_length(self, B: float) -> float:
        """计算子午线弧长"""
        # 子午线弧长系数
        A0 = 1 - self.e2/4 - 3*self.e2**2/64 - 5*self.e2**3/256
        A2 = 3/8 * (self.e2 + self.e2**2/4 + 15*self.e2**3/128)
        A4 = 15/256 * (self.e2**2 + 3*self.e2**3/4)
        A6 = 35*self.e2**3/3072
        
        return self.a * (A0*B - A2*math.sin(2*B) + A4*math.sin(4*B) - A6*math.sin(6*B))
    
    def _foot_point_latitude(self, x: float) -> float:
        """底点纬度迭代计算"""
        # 初始值
        Bf = x / self.a
        
        # 迭代计算
        for _ in range(10):  # 最多迭代10次
            Bf_new = (x + self.a * (
                3*self.e2/8 + 3*self.e2**2/32 + 45*self.e2**3/1024
            ) * math.sin(2*Bf) - self.a * (
                15*self.e2**2/256 + 45*self.e2**3/1024
            ) * math.sin(4*Bf) + self.a * (
                35*self.e2**3/3072
            ) * math.sin(6*Bf)) / (self.a * (1 - self.e2/4 - 3*self.e2**2/64 - 5*self.e2**3/256))
            
            if abs(Bf_new - Bf) < 1e-12:
                break
            Bf = Bf_new
        
        return Bf
    
    def xyz_to_blh(self, x: float, y: float, z: float) -> Tuple[float, float, float]:
        """
        空间直角坐标转大地坐标
        
        Args:
            x, y, z: 空间直角坐标(米)
            
        Returns:
            (B, L, H): 大地坐标(度, 度, 米)
        """
        # 经度计算
        L = math.atan2(y, x)
        
        # 纬度和大地高迭代计算
        p = math.sqrt(x**2 + y**2)
        B = math.atan2(z, p * (1 - self.e2))
        H = 0
        
        for _ in range(10):  # 迭代计算
            N = self.a / math.sqrt(1 - self.e2 * math.sin(B)**2)
            H_new = p / math.cos(B) - N
            B_new = math.atan2(z, p * (1 - self.e2 * N / (N + H_new)))
            
            if abs(B_new - B) < 1e-12 and abs(H_new - H) < 1e-6:
                break
            
            B, H = B_new, H_new
        
        return self.radians_to_degrees(B), self.radians_to_degrees(L), H
    
    def blh_to_xyz(self, B: float, L: float, H: float) -> Tuple[float, float, float]:
        """
        大地坐标转空间直角坐标
        
        Args:
            B, L: 大地坐标(度)
            H: 大地高(米)
            
        Returns:
            (x, y, z): 空间直角坐标(米)
        """
        B_rad = self.degrees_to_radians(B)
        L_rad = self.degrees_to_radians(L)
        
        N = self.a / math.sqrt(1 - self.e2 * math.sin(B_rad)**2)
        
        x = (N + H) * math.cos(B_rad) * math.cos(L_rad)
        y = (N + H) * math.cos(B_rad) * math.sin(L_rad)
        z = (N * (1 - self.e2) + H) * math.sin(B_rad)
        
        return x, y, z
    
    def four_parameter_transform(self, points: List[Dict], 
                               control_points: List[Dict]) -> Dict:
        """
        四参数转换（平面相似变换）
        
        Args:
            points: 待转换点列表
            control_points: 控制点列表，包含源坐标和目标坐标
            
        Returns:
            转换结果和参数
        """
        if len(control_points) < 2:
            raise ValueError("四参数转换至少需要2个控制点")
        
        # 提取控制点坐标
        src_coords = np.array([[p['src_x'], p['src_y']] for p in control_points])
        dst_coords = np.array([[p['dst_x'], p['dst_y']] for p in control_points])
        
        # 计算重心
        src_center = np.mean(src_coords, axis=0)
        dst_center = np.mean(dst_coords, axis=0)
        
        # 去重心化
        src_centered = src_coords - src_center
        dst_centered = dst_coords - dst_center
        
        # 计算参数
        n = len(control_points)
        
        # 构建系数矩阵
        A = np.zeros((2*n, 4))
        L = np.zeros(2*n)
        
        for i in range(n):
            A[2*i] = [1, 0, src_centered[i, 0], -src_centered[i, 1]]
            A[2*i+1] = [0, 1, src_centered[i, 1], src_centered[i, 0]]
            L[2*i] = dst_centered[i, 0]
            L[2*i+1] = dst_centered[i, 1]
        
        # 最小二乘解算
        params = np.linalg.lstsq(A, L, rcond=None)[0]
        
        # 提取参数
        dx = params[0] + dst_center[0] - src_center[0]
        dy = params[1] + dst_center[1] - src_center[1]
        scale = math.sqrt(params[2]**2 + params[3]**2)
        rotation = math.atan2(params[3], params[2])
        
        # 转换待转换点
        results = []
        for point in points:
            x_src = point['x']
            y_src = point['y']
            
            # 应用四参数变换
            x_dst = dx + params[2] * x_src - params[3] * y_src
            y_dst = dy + params[3] * x_src + params[2] * y_src
            
            results.append({
                'name': point['name'],
                'src_x': x_src,
                'src_y': y_src,
                'dst_x': x_dst,
                'dst_y': y_dst
            })
        
        # 计算精度评定
        residuals = []
        for i, cp in enumerate(control_points):
            x_calc = dx + params[2] * cp['src_x'] - params[3] * cp['src_y']
            y_calc = dy + params[3] * cp['src_x'] + params[2] * cp['src_y']
            
            vx = x_calc - cp['dst_x']
            vy = y_calc - cp['dst_y']
            residuals.append({'vx': vx, 'vy': vy, 'v': math.sqrt(vx**2 + vy**2)})
        
        # 单位权中误差
        if len(residuals) > 2:
            sum_vv = sum(r['vx']**2 + r['vy']**2 for r in residuals)
            unit_weight_error = math.sqrt(sum_vv / (2*len(residuals) - 4))
        else:
            unit_weight_error = 0
        
        return {
            'results': results,
            'parameters': {
                'dx': dx,
                'dy': dy,
                'scale': scale,
                'rotation': self.radians_to_degrees(rotation),
                'scale_ppm': (scale - 1) * 1e6
            },
            'accuracy': {
                'residuals': residuals,
                'unit_weight_error': unit_weight_error,
                'max_residual': max(r['v'] for r in residuals) if residuals else 0
            }
        }
    
    def seven_parameter_transform(self, points: List[Dict], 
                                control_points: List[Dict]) -> Dict:
        """
        七参数转换（空间相似变换）
        
        Args:
            points: 待转换点列表
            control_points: 控制点列表，包含源坐标和目标坐标
            
        Returns:
            转换结果和参数
        """
        if len(control_points) < 3:
            raise ValueError("七参数转换至少需要3个控制点")
        
        # 提取控制点坐标
        src_coords = np.array([[p['src_x'], p['src_y'], p['src_z']] for p in control_points])
        dst_coords = np.array([[p['dst_x'], p['dst_y'], p['dst_z']] for p in control_points])
        
        # 计算重心
        src_center = np.mean(src_coords, axis=0)
        dst_center = np.mean(dst_coords, axis=0)
        
        # 去重心化
        src_centered = src_coords - src_center
        dst_centered = dst_coords - dst_center
        
        # 构建系数矩阵（简化的七参数模型）
        n = len(control_points)
        A = np.zeros((3*n, 7))
        L = np.zeros(3*n)
        
        for i in range(n):
            x, y, z = src_centered[i]
            A[3*i] = [1, 0, 0, 1, 0, -z, y]
            A[3*i+1] = [0, 1, 0, 0, 1, z, -x]
            A[3*i+2] = [0, 0, 1, 0, 0, -y, x]
            
            L[3*i:3*i+3] = dst_centered[i]
        
        # 最小二乘解算
        params = np.linalg.lstsq(A, L, rcond=None)[0]
        
        # 提取参数
        dx = params[0] + dst_center[0] - src_center[0]
        dy = params[1] + dst_center[1] - src_center[1]
        dz = params[2] + dst_center[2] - src_center[2]
        scale = 1 + params[3]
        rx = params[4]  # 弧度
        ry = params[5]  # 弧度
        rz = params[6]  # 弧度
        
        # 转换待转换点
        results = []
        for point in points:
            x_src = point['x']
            y_src = point['y']
            z_src = point['z']
            
            # 应用七参数变换（简化）
            x_dst = dx + scale * (x_src - rz * y_src + ry * z_src)
            y_dst = dy + scale * (rz * x_src + y_src - rx * z_src)
            z_dst = dz + scale * (-ry * x_src + rx * y_src + z_src)
            
            results.append({
                'name': point['name'],
                'src_x': x_src,
                'src_y': y_src,
                'src_z': z_src,
                'dst_x': x_dst,
                'dst_y': y_dst,
                'dst_z': z_dst
            })
        
        # 计算精度评定
        residuals = []
        for i, cp in enumerate(control_points):
            x_calc = dx + scale * (cp['src_x'] - rz * cp['src_y'] + ry * cp['src_z'])
            y_calc = dy + scale * (rz * cp['src_x'] + cp['src_y'] - rx * cp['src_z'])
            z_calc = dz + scale * (-ry * cp['src_x'] + rx * cp['src_y'] + cp['src_z'])
            
            vx = x_calc - cp['dst_x']
            vy = y_calc - cp['dst_y']
            vz = z_calc - cp['dst_z']
            residuals.append({
                'vx': vx, 'vy': vy, 'vz': vz, 
                'v': math.sqrt(vx**2 + vy**2 + vz**2)
            })
        
        # 单位权中误差
        if len(residuals) > 3:
            sum_vv = sum(r['vx']**2 + r['vy']**2 + r['vz']**2 for r in residuals)
            unit_weight_error = math.sqrt(sum_vv / (3*len(residuals) - 7))
        else:
            unit_weight_error = 0
        
        return {
            'results': results,
            'parameters': {
                'dx': dx, 'dy': dy, 'dz': dz,
                'scale': scale,
                'rx': self.radians_to_degrees(rx),
                'ry': self.radians_to_degrees(ry),
                'rz': self.radians_to_degrees(rz),
                'scale_ppm': (scale - 1) * 1e6
            },
            'accuracy': {
                'residuals': residuals,
                'unit_weight_error': unit_weight_error,
                'max_residual': max(r['v'] for r in residuals) if residuals else 0
            }
        }
    
    def zone_transform_3_to_6(self, x: float, y: float, zone_3: int) -> Tuple[float, float, int]:
        """3度带转6度带"""
        # 计算6度带号
        zone_6 = (zone_3 + 1) // 2
        
        # 计算中央子午线
        L0_3 = zone_3 * 3
        L0_6 = zone_6 * 6 - 3
        
        # 先反算到大地坐标
        lat, lon = self.gauss_inverse(x, y, L0_3)
        
        # 再正算到6度带
        x_new, y_new = self.gauss_forward(lat, lon, L0_6)
        
        return x_new, y_new, zone_6
    
    def zone_transform_6_to_3(self, x: float, y: float, zone_6: int) -> Tuple[float, float, int]:
        """6度带转3度带"""
        # 计算中央子午线
        L0_6 = zone_6 * 6 - 3
        
        # 先反算到大地坐标
        lat, lon = self.gauss_inverse(x, y, L0_6)
        
        # 计算3度带号
        zone_3 = int((lon + 1.5) // 3)
        L0_3 = zone_3 * 3
        
        # 再正算到3度带
        x_new, y_new = self.gauss_forward(lat, lon, L0_3)
        
        return x_new, y_new, zone_3