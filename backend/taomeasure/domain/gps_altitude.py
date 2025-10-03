"""
GPS高程转换模块 - 实现GPS高程异常拟合和正常高计算
"""

import numpy as np
from scipy.optimize import least_squares
from scipy.linalg import lstsq
import math

class GPSAltitudeConverter:
    """GPS高程转换计算类"""
    
    def __init__(self):
        pass
    
    def vertical_translation_model(self, known_points, unknown_points):
        """
        使用垂直平移模型计算未知点的正常高
        
        Args:
            known_points (list): 已知GPS水准点列表，每个点包含 'name', 'lat', 'lon', 'H'(大地高), 'anomaly'(高程异常)
            unknown_points (list): 未知点列表，每个点包含 'name', 'lat', 'lon', 'H'(大地高)
        
        Returns:
            dict: 包含计算结果和精度评定的字典
        """
        if not known_points:
            return {'error': '需要至少一个已知GPS水准点'}
        
        # 计算高程异常
        height_anomalies = [point['anomaly'] for point in known_points]
        avg_height_anomaly = np.mean(height_anomalies)
        
        # 精度评定
        residuals = [anomaly - avg_height_anomaly for anomaly in height_anomalies]
        n = len(known_points)
        if n > 1:
            unit_weight_error = np.sqrt(np.sum([r**2 for r in residuals]) / (n - 1))
        else:
            unit_weight_error = 0.0
        
        # 计算未知点正常高
        results = []
        for point in unknown_points:
            normal_height = point['H'] - avg_height_anomaly
            results.append({
                'name': point['name'],
                'lat': point['lat'],
                'lon': point['lon'],
                'H': point['H'],
                'calculated_anomaly': avg_height_anomaly,
                'normal_height': normal_height
            })
        
        return {
            'model': 'vertical_translation',
            'results': results,
            'parameters': {
                'avg_height_anomaly': avg_height_anomaly
            },
            'unit_weight_error': unit_weight_error,
            'max_residual': max(residuals) if residuals else 0.0,
            'min_residual': min(residuals) if residuals else 0.0,
            'accuracy_assessment': {
                'known_points_count': len(known_points),
                'residuals': residuals,
                'rms': unit_weight_error
            }
        }
    
    def linear_basis_fitting(self, known_points, unknown_points, model_params=None):
        """
        使用线性基函数拟合模型计算未知点的正常高
        
        Args:
            known_points (list): 已知GPS水准点列表
            unknown_points (list): 未知点列表
            model_params (dict): 模型参数，包含 'model_type' 和 'coordinate_system'
        
        Returns:
            dict: 包含计算结果和精度评定的字典
        """
        if len(known_points) < 2:
            return {'error': '线性基函数拟合需要至少2个已知GPS水准点'}
        
        if model_params is None:
            model_params = {}
        
        model_type = model_params.get('model_type', 'quadratic')
        coordinate_system = model_params.get('coordinate_system', 'WGS84')
        
        # 建立独立线路坐标系
        # 1. 计算测区平均经纬度作为参考点
        avg_lat = np.mean([point['lat'] for point in known_points])
        avg_lon = np.mean([point['lon'] for point in known_points])
        
        # 2. 线路中线拟合（最小二乘法）
        lats = np.array([point['lat'] for point in known_points])
        lons = np.array([point['lon'] for point in known_points])
        
        # 计算中线方位角
        delta_lat = lats - avg_lat
        delta_lon = lons - avg_lon
        
        # 最小二乘拟合直线
        A_line = np.vstack([np.ones(len(delta_lat)), delta_lat]).T
        slope, intercept = np.linalg.lstsq(A_line, delta_lon, rcond=None)[0]
        line_azimuth = np.arctan2(slope, 1.0)
        
        # 3. 转换到线路坐标系
        y_coords = []
        for point in known_points:
            # 简化的投影变换（适用于小范围）
            delta_lat = (point['lat'] - avg_lat) * np.pi / 180 * 6371000  # 转换为米
            delta_lon = (point['lon'] - avg_lon) * np.pi / 180 * 6371000 * np.cos(avg_lat * np.pi / 180)
            
            # 旋转到线路坐标系
            y = delta_lat * np.cos(line_azimuth) + delta_lon * np.sin(line_azimuth)
            y_coords.append(y)
        
        # 4. 建立拟合方程
        height_anomalies = [point['anomaly'] for point in known_points]
        
        if model_type == 'linear':
            # 线性模型: ζ = a₀ + a₁y
            A_fit = np.column_stack([np.ones(len(y_coords)), y_coords])
        elif model_type == 'quadratic':
            # 二次模型: ζ = a₀ + a₁y + a₂y²
            A_fit = np.column_stack([np.ones(len(y_coords)), y_coords, np.array(y_coords)**2])
        else:
            return {'error': f'不支持的模型类型: {model_type}'}
        
        # 最小二乘求解
        coefficients, residuals_sum, rank, s = np.linalg.lstsq(A_fit, height_anomalies, rcond=None)
        
        # 计算残差和精度评定
        fitted_anomalies = A_fit @ coefficients
        residuals = np.array(height_anomalies) - fitted_anomalies
        
        n = len(known_points)
        p = len(coefficients)  # 参数个数
        if n > p:
            unit_weight_error = np.sqrt(np.sum(residuals**2) / (n - p))
        else:
            unit_weight_error = 0.0
        
        # 计算未知点正常高
        results = []
        for point in unknown_points:
            # 转换未知点到线路坐标系
            delta_lat = (point['lat'] - avg_lat) * np.pi / 180 * 6371000
            delta_lon = (point['lon'] - avg_lon) * np.pi / 180 * 6371000 * np.cos(avg_lat * np.pi / 180)
            y = delta_lat * np.cos(line_azimuth) + delta_lon * np.sin(line_azimuth)
            
            # 计算高程异常
            if model_type == 'linear':
                calculated_anomaly = coefficients[0] + coefficients[1] * y
            elif model_type == 'quadratic':
                calculated_anomaly = coefficients[0] + coefficients[1] * y + coefficients[2] * y**2
            
            normal_height = point['H'] - calculated_anomaly
            
            results.append({
                'name': point['name'],
                'lat': point['lat'],
                'lon': point['lon'],
                'H': point['H'],
                'y_coord': y,
                'calculated_anomaly': calculated_anomaly,
                'normal_height': normal_height
            })
        
        return {
            'model': 'linear_basis',
            'results': results,
            'parameters': {
                'model_type': model_type,
                'coefficients': coefficients.tolist(),
                'line_azimuth': line_azimuth,
                'reference_point': {'lat': avg_lat, 'lon': avg_lon}
            },
            'unit_weight_error': unit_weight_error,
            'max_residual': float(np.max(residuals)) if len(residuals) > 0 else 0.0,
            'min_residual': float(np.min(residuals)) if len(residuals) > 0 else 0.0,
            'accuracy_assessment': {
                'known_points_count': len(known_points),
                'residuals': residuals.tolist(),
                'rms': unit_weight_error,
                'fitted_anomalies': fitted_anomalies.tolist()
            }
        }
    
    def surface_basis_fitting(self, known_points, unknown_points, model_params=None):
        """
        使用面基函数拟合模型计算未知点的正常高
        
        Args:
            known_points (list): 已知GPS水准点列表
            unknown_points (list): 未知点列表
            model_params (dict): 模型参数，包含 'model_type' 和 'coordinate_system'
        
        Returns:
            dict: 包含计算结果和精度评定的字典
        """
        if len(known_points) < 3:
            return {'error': '面基函数拟合需要至少3个已知GPS水准点'}
        
        if model_params is None:
            model_params = {}
        
        model_type = model_params.get('model_type', 'quadratic')
        coordinate_system = model_params.get('coordinate_system', 'WGS84')
        
        # 建立平面坐标系
        # 1. 计算测区中心点
        avg_lat = np.mean([point['lat'] for point in known_points])
        avg_lon = np.mean([point['lon'] for point in known_points])
        
        # 2. 转换到平面坐标系（简化投影）
        x_coords = []
        y_coords = []
        for point in known_points:
            # 简化的投影变换
            x = (point['lon'] - avg_lon) * np.pi / 180 * 6371000 * np.cos(avg_lat * np.pi / 180)
            y = (point['lat'] - avg_lat) * np.pi / 180 * 6371000
            x_coords.append(x)
            y_coords.append(y)
        
        # 3. 建立拟合方程
        height_anomalies = [point['anomaly'] for point in known_points]
        
        if model_type == 'linear':
            # 线性模型: ζ = a₀ + a₁x + a₂y
            A_fit = np.column_stack([
                np.ones(len(x_coords)),
                x_coords,
                y_coords
            ])
        elif model_type == 'quadratic':
            # 二次模型: ζ = a₀ + a₁x + a₂y + a₃x² + a₄xy + a₅y²
            A_fit = np.column_stack([
                np.ones(len(x_coords)),
                x_coords,
                y_coords,
                np.array(x_coords)**2,
                np.array(x_coords) * np.array(y_coords),
                np.array(y_coords)**2
            ])
        else:
            return {'error': f'不支持的模型类型: {model_type}'}
        
        # 最小二乘求解
        coefficients, residuals_sum, rank, s = np.linalg.lstsq(A_fit, height_anomalies, rcond=None)
        
        # 计算残差和精度评定
        fitted_anomalies = A_fit @ coefficients
        residuals = np.array(height_anomalies) - fitted_anomalies
        
        n = len(known_points)
        p = len(coefficients)  # 参数个数
        if n > p:
            unit_weight_error = np.sqrt(np.sum(residuals**2) / (n - p))
        else:
            unit_weight_error = 0.0
        
        # 计算未知点正常高
        results = []
        for point in unknown_points:
            # 转换未知点到平面坐标系
            x = (point['lon'] - avg_lon) * np.pi / 180 * 6371000 * np.cos(avg_lat * np.pi / 180)
            y = (point['lat'] - avg_lat) * np.pi / 180 * 6371000
            
            # 计算高程异常
            if model_type == 'linear':
                calculated_anomaly = coefficients[0] + coefficients[1] * x + coefficients[2] * y
            elif model_type == 'quadratic':
                calculated_anomaly = (coefficients[0] + coefficients[1] * x + coefficients[2] * y +
                                    coefficients[3] * x**2 + coefficients[4] * x * y + coefficients[5] * y**2)
            
            normal_height = point['H'] - calculated_anomaly
            
            results.append({
                'name': point['name'],
                'lat': point['lat'],
                'lon': point['lon'],
                'H': point['H'],
                'x_coord': x,
                'y_coord': y,
                'calculated_anomaly': calculated_anomaly,
                'normal_height': normal_height
            })
        
        return {
            'model': 'surface_basis',
            'results': results,
            'parameters': {
                'model_type': model_type,
                'coefficients': coefficients.tolist(),
                'reference_point': {'lat': avg_lat, 'lon': avg_lon}
            },
            'unit_weight_error': unit_weight_error,
            'max_residual': float(np.max(residuals)) if len(residuals) > 0 else 0.0,
            'min_residual': float(np.min(residuals)) if len(residuals) > 0 else 0.0,
            'accuracy_assessment': {
                'known_points_count': len(known_points),
                'residuals': residuals.tolist(),
                'rms': unit_weight_error,
                'fitted_anomalies': fitted_anomalies.tolist()
            }
        }


# 兼容性函数（保持向后兼容）
def vertical_translation(known_points, unknown_points):
    """垂直平移模型（兼容性函数）"""
    converter = GPSAltitudeConverter()
    return converter.vertical_translation_model(known_points, unknown_points)

def linear_basis_fitting(known_points, unknown_points, model_type='quadratic', coordinate_system='WGS84'):
    """线性基函数拟合（兼容性函数）"""
    converter = GPSAltitudeConverter()
    model_params = {
        'model_type': model_type,
        'coordinate_system': coordinate_system
    }
    return converter.linear_basis_fitting(known_points, unknown_points, model_params)

def surface_basis_fitting(known_points, unknown_points, model_type='quadratic', coordinate_system='WGS84'):
    """面基函数拟合（兼容性函数）"""
    converter = GPSAltitudeConverter()
    model_params = {
        'model_type': model_type,
        'coordinate_system': coordinate_system
    }
    return converter.surface_basis_fitting(known_points, unknown_points, model_params)