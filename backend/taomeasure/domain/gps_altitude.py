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
                '平均高程异常': avg_height_anomaly,
                '已知点数量': len(known_points),
                '未知点数量': len(unknown_points)
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
                '模型类型': '线性模型' if model_type == 'linear' else '二次曲线模型',
                '拟合系数': {
                    '常数项 a₀': float(coefficients[0]),
                    '一次项系数 a₁': float(coefficients[1]),
                    '二次项系数 a₂': float(coefficients[2]) if len(coefficients) > 2 else None
                },
                '线路方位角': float(line_azimuth),
                '已知点数量': len(known_points),
                '未知点数量': len(unknown_points)
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
        
        # 建立参考点坐标系
        # 1. 计算测区参考点（B₀和L₀）
        ref_lat = np.mean([point['lat'] for point in known_points])
        ref_lon = np.mean([point['lon'] for point in known_points])
        
        # 2. 计算各点相对于参考点的大地经纬度差值
        delta_B_coords = []
        delta_L_coords = []
        for point in known_points:
            # 计算大地经纬度差值（单位：度）
            delta_B = point['lat'] - ref_lat
            delta_L = point['lon'] - ref_lon
            delta_B_coords.append(delta_B)
            delta_L_coords.append(delta_L)
        
        # 3. 建立拟合方程
        height_anomalies = [point['anomaly'] for point in known_points]
        
        if model_type == 'plane':
            # 平面模型: ζ = a₀ + a₁ΔB + a₂ΔL
            A_fit = np.column_stack([
                np.ones(len(delta_B_coords)),
                delta_B_coords,
                delta_L_coords
            ])
        elif model_type == 'quadratic':
            # 二次模型: ζ = a₀ + a₁ΔB + a₂ΔB² + a₃ΔL + a₄ΔL² + a₅ΔLΔB
            A_fit = np.column_stack([
                np.ones(len(delta_B_coords)),
                delta_B_coords,
                np.array(delta_B_coords)**2,
                delta_L_coords,
                np.array(delta_L_coords)**2,
                np.array(delta_L_coords) * np.array(delta_B_coords)
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
            # 计算未知点相对于参考点的大地经纬度差值（单位：度）
            delta_B = point['lat'] - ref_lat
            delta_L = point['lon'] - ref_lon
            
            # 计算高程异常
            if model_type == 'plane':
                calculated_anomaly = coefficients[0] + coefficients[1] * delta_B + coefficients[2] * delta_L
            elif model_type == 'quadratic':
                calculated_anomaly = (coefficients[0] + coefficients[1] * delta_B + coefficients[2] * delta_B**2 + 
                                    coefficients[3] * delta_L + coefficients[4] * delta_L**2 + 
                                    coefficients[5] * delta_L * delta_B)
            
            normal_height = point['H'] - calculated_anomaly
            
            results.append({
                'name': point['name'],
                'lat': point['lat'],
                'lon': point['lon'],
                'H': point['H'],
                'delta_B': delta_B,
                'delta_L': delta_L,
                'calculated_anomaly': calculated_anomaly,
                'normal_height': normal_height
            })
        
        return {
            'model': 'surface_basis',
            'results': results,
            'parameters': {
                '模型类型': '平面模型' if model_type == 'plane' else '平面二次模型',
                '拟合系数': {
                    '常数项 a₀': float(coefficients[0]),
                    '一次项系数 a₁': float(coefficients[1]),
                    '二次项系数 a₂': float(coefficients[2]),
                    '一次项系数 a₃': float(coefficients[3]) if len(coefficients) > 3 else None,
                    '二次项系数 a₄': float(coefficients[4]) if len(coefficients) > 4 else None,
                    '交叉项系数 a₅': float(coefficients[5]) if len(coefficients) > 5 else None
                },
                '参考点坐标': {'纬度 B₀': float(ref_lat), '经度 L₀': float(ref_lon)},
                '已知点数量': len(known_points),
                '未知点数量': len(unknown_points)
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