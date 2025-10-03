"""
文件处理模块 - 处理各种格式的坐标数据文件导入导出
"""

import os
import re
import csv
from typing import List, Dict, Tuple, Optional, Any
from io import StringIO


class FileHandler:
    """文件处理类"""
    
    def __init__(self):
        self.supported_formats = ['.txt', '.csv', '.dat']
    
    @staticmethod
    def parse_coordinate_value(value_str: str) -> Optional[float]:
        """解析坐标值，支持多种格式包括度分秒格式 d.mmss"""
        try:
            value_str = value_str.strip()
            if not value_str:
                return None
            
            # 检查是否是度分秒格式 (d.mmss, dd.mmss, ddd.mmss)
            if '.' in value_str:
                parts = value_str.split('.')
                if len(parts) == 2 and len(parts[1]) == 4:
                    # 度分秒格式：d.mmss
                    degrees = float(parts[0])
                    mmss = parts[1]
                    
                    minutes = float(mmss[:2])
                    seconds = float(mmss[2:])
                    
                    # 转换为十进制度
                    decimal_degrees = abs(degrees) + minutes/60.0 + seconds/3600.0
                    if degrees < 0:
                        decimal_degrees = -decimal_degrees
                    
                    return decimal_degrees
            
            # 直接转换为浮点数
            return float(value_str)
        except (ValueError, IndexError):
            return None
    
    def parse_coordinate_file(self, file_content: str, file_type: str) -> Dict[str, Any]:
        """
        解析坐标文件
        
        Args:
            file_content: 文件内容
            file_type: 文件类型标识
            
        Returns:
            解析结果字典
        """
        lines = file_content.strip().split('\n')
        points = []
        
        if file_type == 'geodetic_to_cartesian':
            # 大地坐标转空间直角坐标格式：点名 纬度 经度 大地高
            for line in lines:
                if line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 4:
                        lat = self.parse_coordinate_value(parts[1])
                        lon = self.parse_coordinate_value(parts[2])
                        height = self.parse_coordinate_value(parts[3])
                        if lat is not None and lon is not None and height is not None:
                            points.append({
                                'name': parts[0],
                                'lat': lat,
                                'lon': lon,
                                'height': height
                            })
        
        elif file_type == 'cartesian_to_geodetic':
            # 空间直角坐标转大地坐标格式：点名 X Y Z
            for line in lines:
                if line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 4:
                        x = self.parse_coordinate_value(parts[1])
                        y = self.parse_coordinate_value(parts[2])
                        z = self.parse_coordinate_value(parts[3])
                        if x is not None and y is not None and z is not None:
                            points.append({
                                'name': parts[0],
                                'x': x,
                                'y': y,
                                'z': z
                            })
        
        elif file_type == 'gauss_forward':
            # 高斯投影正算格式：点名 纬度 经度
            for line in lines:
                if line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 3:
                        lat = self.parse_coordinate_value(parts[1])
                        lon = self.parse_coordinate_value(parts[2])
                        if lat is not None and lon is not None:
                            points.append({
                                'name': parts[0],
                                'lat': lat,
                                'lon': lon
                            })
        
        elif file_type == 'gauss_inverse':
            # 高斯投影反算格式：点名 X Y
            for line in lines:
                if line.strip():
                    parts = line.strip().split()
                    if len(parts) >= 3:
                        x = self.parse_coordinate_value(parts[1])
                        y = self.parse_coordinate_value(parts[2])
                        if x is not None and y is not None:
                            points.append({
                                'name': parts[0],
                                'x': x,
                                'y': y
                            })
        
        elif file_type == 'four_param_control':
            # 四参数控制点格式：点号 源X 源Y 目标X 目标Y
            for line in lines:
                if line.strip():
                    parts = line.strip().split('\t')  # 使用制表符分隔
                    if len(parts) >= 5:
                        src_x = self.parse_coordinate_value(parts[1])
                        src_y = self.parse_coordinate_value(parts[2])
                        dst_x = self.parse_coordinate_value(parts[3])
                        dst_y = self.parse_coordinate_value(parts[4])
                        if all(v is not None for v in [src_x, src_y, dst_x, dst_y]):
                            points.append({
                                'name': parts[0],
                                'src_x': src_x,
                                'src_y': src_y,
                                'dst_x': dst_x,
                                'dst_y': dst_y
                            })
        
        elif file_type == 'four_param_unknown':
            # 四参数未知点格式：点号 X Y
            for line in lines:
                if line.strip():
                    parts = line.strip().split('\t')  # 使用制表符分隔
                    if len(parts) >= 3:
                        x = self.parse_coordinate_value(parts[1])
                        y = self.parse_coordinate_value(parts[2])
                        if x is not None and y is not None:
                            points.append({
                                'name': parts[0],
                                'x': x,
                                'y': y
                            })
        
        elif file_type == 'seven_param_control':
            # 七参数控制点格式：点号 源X 源Y 源Z 目标X 目标Y 目标Z
            for line in lines:
                if line.strip():
                    parts = line.strip().split('\t')  # 使用制表符分隔
                    if len(parts) >= 7:
                        coords = [self.parse_coordinate_value(parts[i]) for i in range(1, 7)]
                        if all(v is not None for v in coords):
                            points.append({
                                'name': parts[0],
                                'src_x': coords[0],
                                'src_y': coords[1],
                                'src_z': coords[2],
                                'dst_x': coords[3],
                                'dst_y': coords[4],
                                'dst_z': coords[5]
                            })
        
        elif file_type == 'seven_param_unknown':
            # 七参数未知点格式：点号 X Y Z
            for line in lines:
                if line.strip():
                    parts = line.strip().split('\t')  # 使用制表符分隔
                    if len(parts) >= 4:
                        x = self.parse_coordinate_value(parts[1])
                        y = self.parse_coordinate_value(parts[2])
                        z = self.parse_coordinate_value(parts[3])
                        if all(v is not None for v in [x, y, z]):
                            points.append({
                                'name': parts[0],
                                'x': x,
                                'y': y,
                                'z': z
                            })
        
        elif file_type == 'zone_transform':
            # 换带变换格式：点名 X Y 或 点名,X,Y,H
            for line in lines:
                if line.strip():
                    # 支持空格和逗号分隔
                    if ',' in line:
                        parts = line.strip().split(',')
                        if len(parts) >= 3:
                            x = self.parse_coordinate_value(parts[1])
                            y = self.parse_coordinate_value(parts[2])
                            if x is not None and y is not None:
                                point = {
                                    'name': parts[0],
                                    'x': x,
                                    'y': y
                                }
                                if len(parts) >= 4:
                                    height = self.parse_coordinate_value(parts[3])
                                    if height is not None:
                                        point['height'] = height
                                points.append(point)
                    else:
                        parts = line.strip().split()
                        if len(parts) >= 3:
                            x = self.parse_coordinate_value(parts[1])
                            y = self.parse_coordinate_value(parts[2])
                            if x is not None and y is not None:
                                points.append({
                                    'name': parts[0],
                                    'x': x,
                                    'y': y
                                })
        
        return {
            'points': points,
            'count': len(points),
            'format': file_type
        }
    
    def export_results_to_text(self, results: List[Dict[str, Any]], result_type: str) -> str:
        """
        导出结果为文本格式
        
        Args:
            results: 计算结果列表
            result_type: 结果类型
            
        Returns:
            格式化的文本内容
        """
        output_lines = []
        
        if result_type == 'geodetic_to_cartesian':
            # 大地坐标转空间直角坐标结果
            output_lines.append("点名\t\tX(m)\t\tY(m)\t\tZ(m)")
            output_lines.append("-" * 60)
            for result in results:
                output_lines.append(f"{result['name']}\t\t{result['x']:.3f}\t\t{result['y']:.3f}\t\t{result['z']:.3f}")
        
        elif result_type == 'cartesian_to_geodetic':
            # 空间直角坐标转大地坐标结果
            output_lines.append("点名\t\t纬度(°)\t\t经度(°)\t\t大地高(m)")
            output_lines.append("-" * 70)
            for result in results:
                output_lines.append(f"{result['name']}\t\t{result['lat']:.8f}\t\t{result['lon']:.8f}\t\t{result['height']:.3f}")
        
        elif result_type == 'gauss_forward':
            # 高斯投影正算结果
            output_lines.append("点名\t\tX(m)\t\tY(m)")
            output_lines.append("-" * 50)
            for result in results:
                output_lines.append(f"{result['name']}\t\t{result['x']:.3f}\t\t{result['y']:.3f}")
        
        elif result_type == 'gauss_inverse':
            # 高斯投影反算结果
            output_lines.append("点名\t\t纬度(°)\t\t经度(°)")
            output_lines.append("-" * 60)
            for result in results:
                output_lines.append(f"{result['name']}\t\t{result['lat']:.8f}\t\t{result['lon']:.8f}")
        
        elif result_type == 'four_parameter':
            # 四参数转换结果
            output_lines.append("四参数转换结果")
            output_lines.append("=" * 50)
            output_lines.append("")
            
            # 转换参数
            if 'parameters' in results[0]:
                params = results[0]['parameters']
                output_lines.append("转换参数:")
                output_lines.append(f"平移参数 ΔX = {params['dx']:.6f} m")
                output_lines.append(f"平移参数 ΔY = {params['dy']:.6f} m")
                output_lines.append(f"尺度因子 K = {params['scale']:.8f}")
                output_lines.append(f"尺度因子 K = {params['scale_ppm']:.2f} ppm")
                output_lines.append(f"旋转角 α = {params['rotation']:.6f}°")
                output_lines.append("")
            
            # 转换结果
            output_lines.append("点名\t\t源X(m)\t\t源Y(m)\t\t目标X(m)\t\t目标Y(m)")
            output_lines.append("-" * 80)
            for result in results:
                if 'results' in result:
                    for point in result['results']:
                        output_lines.append(f"{point['name']}\t\t{point['src_x']:.3f}\t\t{point['src_y']:.3f}\t\t{point['dst_x']:.3f}\t\t{point['dst_y']:.3f}")
        
        elif result_type == 'seven_parameter':
            # 七参数转换结果
            output_lines.append("七参数转换结果")
            output_lines.append("=" * 50)
            output_lines.append("")
            
            # 转换参数
            if 'parameters' in results[0]:
                params = results[0]['parameters']
                output_lines.append("转换参数:")
                output_lines.append(f"平移参数 ΔX = {params['dx']:.6f} m")
                output_lines.append(f"平移参数 ΔY = {params['dy']:.6f} m")
                output_lines.append(f"平移参数 ΔZ = {params['dz']:.6f} m")
                output_lines.append(f"尺度因子 K = {params['scale']:.8f}")
                output_lines.append(f"尺度因子 K = {params['scale_ppm']:.2f} ppm")
                output_lines.append(f"旋转角 εX = {params['rx']:.6f}″")
                output_lines.append(f"旋转角 εY = {params['ry']:.6f}″")
                output_lines.append(f"旋转角 εZ = {params['rz']:.6f}″")
                output_lines.append("")
            
            # 转换结果
            output_lines.append("点名\t\t源X(m)\t\t源Y(m)\t\t源Z(m)\t\t目标X(m)\t\t目标Y(m)\t\t目标Z(m)")
            output_lines.append("-" * 100)
            for result in results:
                if 'results' in result:
                    for point in result['results']:
                        output_lines.append(f"{point['name']}\t\t{point['src_x']:.3f}\t\t{point['src_y']:.3f}\t\t{point['src_z']:.3f}\t\t{point['dst_x']:.3f}\t\t{point['dst_y']:.3f}\t\t{point['dst_z']:.3f}")
        
        elif result_type == 'zone_transform':
            # 换带变换结果
            output_lines.append("点名\t\t原X(m)\t\t原Y(m)\t\t新X(m)\t\t新Y(m)\t\t带号")
            output_lines.append("-" * 80)
            for result in results:
                zone_info = f"→{result.get('new_zone', '')}" if 'new_zone' in result else ""
                output_lines.append(f"{result['name']}\t\t{result['src_x']:.3f}\t\t{result['src_y']:.3f}\t\t{result['dst_x']:.3f}\t\t{result['dst_y']:.3f}\t\t{zone_info}")
        
        return '\n'.join(output_lines)
    
    def export_results_to_csv(self, results: List[Dict[str, Any]], result_type: str) -> str:
        """
        导出结果为CSV格式
        
        Args:
            results: 计算结果列表
            result_type: 结果类型
            
        Returns:
            CSV格式的文本内容
        """
        output = StringIO()
        writer = csv.writer(output)
        
        if result_type == 'geodetic_to_cartesian':
            writer.writerow(['点名', 'X(m)', 'Y(m)', 'Z(m)'])
            for result in results:
                writer.writerow([result['name'], f"{result['x']:.3f}", f"{result['y']:.3f}", f"{result['z']:.3f}"])
        
        elif result_type == 'cartesian_to_geodetic':
            writer.writerow(['点名', '纬度(°)', '经度(°)', '大地高(m)'])
            for result in results:
                writer.writerow([result['name'], f"{result['lat']:.8f}", f"{result['lon']:.8f}", f"{result['height']:.3f}"])
        
        elif result_type == 'gauss_forward':
            writer.writerow(['点名', 'X(m)', 'Y(m)'])
            for result in results:
                writer.writerow([result['name'], f"{result['x']:.3f}", f"{result['y']:.3f}"])
        
        elif result_type == 'gauss_inverse':
            writer.writerow(['点名', '纬度(°)', '经度(°)'])
            for result in results:
                writer.writerow([result['name'], f"{result['lat']:.8f}", f"{result['lon']:.8f}"])
        
        elif result_type == 'four_parameter':
            writer.writerow(['点名', '源X(m)', '源Y(m)', '目标X(m)', '目标Y(m)'])
            for result in results:
                if 'results' in result:
                    for point in result['results']:
                        writer.writerow([point['name'], f"{point['src_x']:.3f}", f"{point['src_y']:.3f}", 
                                       f"{point['dst_x']:.3f}", f"{point['dst_y']:.3f}"])
        
        elif result_type == 'seven_parameter':
            writer.writerow(['点名', '源X(m)', '源Y(m)', '源Z(m)', '目标X(m)', '目标Y(m)', '目标Z(m)'])
            for result in results:
                if 'results' in result:
                    for point in result['results']:
                        writer.writerow([point['name'], f"{point['src_x']:.3f}", f"{point['src_y']:.3f}", f"{point['src_z']:.3f}",
                                       f"{point['dst_x']:.3f}", f"{point['dst_y']:.3f}", f"{point['dst_z']:.3f}"])
        
        elif result_type == 'zone_transform':
            writer.writerow(['点名', '原X(m)', '原Y(m)', '新X(m)', '新Y(m)', '新带号'])
            for result in results:
                writer.writerow([result['name'], f"{result['src_x']:.3f}", f"{result['src_y']:.3f}", 
                               f"{result['dst_x']:.3f}", f"{result['dst_y']:.3f}", result.get('new_zone', '')])
        
        return output.getvalue()
    
    def validate_file_format(self, file_content: str, expected_format: str) -> Tuple[bool, str]:
        """
        验证文件格式是否正确
        
        Args:
            file_content: 文件内容
            expected_format: 期望的格式类型
            
        Returns:
            (是否有效, 错误信息)
        """
        lines = file_content.strip().split('\n')
        
        if not lines or all(not line.strip() for line in lines):
            return False, "文件为空"
        
        valid_lines = [line for line in lines if line.strip()]
        
        if expected_format == 'geodetic_to_cartesian':
            # 检查格式：点名 纬度 经度 大地高
            for i, line in enumerate(valid_lines):
                parts = line.strip().split()
                if len(parts) < 4:
                    return False, f"第{i+1}行格式错误：应包含点名、纬度、经度、大地高"
                try:
                    float(parts[1])  # 纬度
                    float(parts[2])  # 经度
                    float(parts[3])  # 大地高
                except ValueError:
                    return False, f"第{i+1}行数值格式错误"
        
        elif expected_format == 'cartesian_to_geodetic':
            # 检查格式：点名 X Y Z
            for i, line in enumerate(valid_lines):
                parts = line.strip().split()
                if len(parts) < 4:
                    return False, f"第{i+1}行格式错误：应包含点名、X、Y、Z坐标"
                try:
                    float(parts[1])  # X
                    float(parts[2])  # Y
                    float(parts[3])  # Z
                except ValueError:
                    return False, f"第{i+1}行数值格式错误"
        
        elif expected_format in ['gauss_forward', 'gauss_inverse']:
            # 检查基本的点名和坐标格式
            for i, line in enumerate(valid_lines):
                parts = line.strip().split()
                if len(parts) < 3:
                    return False, f"第{i+1}行格式错误：数据不完整"
                try:
                    float(parts[1])
                    float(parts[2])
                except ValueError:
                    return False, f"第{i+1}行数值格式错误"
        
        elif expected_format in ['four_param_control', 'four_param_unknown', 
                                'seven_param_control', 'seven_param_unknown']:
            # 检查参数转换文件格式（制表符分隔）
            for i, line in enumerate(valid_lines):
                parts = line.strip().split('\t')
                min_parts = 5 if 'control' in expected_format else 3
                if 'seven_param' in expected_format:
                    min_parts += 1 if 'control' in expected_format else 1
                
                if len(parts) < min_parts:
                    return False, f"第{i+1}行格式错误：数据列数不足"
                
                # 验证数值部分
                try:
                    for j in range(1, len(parts)):
                        float(parts[j])
                except ValueError:
                    return False, f"第{i+1}行数值格式错误"
        
        return True, ""
    
    def get_file_info(self, file_content: str) -> Dict[str, Any]:
        """
        获取文件基本信息
        
        Args:
            file_content: 文件内容
            
        Returns:
            文件信息字典
        """
        lines = file_content.strip().split('\n')
        valid_lines = [line for line in lines if line.strip()]
        
        # 尝试检测文件格式
        detected_format = "unknown"
        if valid_lines:
            first_line = valid_lines[0].strip()
            parts_space = first_line.split()
            parts_tab = first_line.split('\t')
            parts_comma = first_line.split(',')
            
            if len(parts_tab) > len(parts_space) and len(parts_tab) >= 5:
                detected_format = "parameter_transform"
            elif len(parts_comma) > 1:
                detected_format = "zone_transform"
            elif len(parts_space) == 4:
                # 可能是大地坐标转空间直角坐标或空间直角坐标转大地坐标
                try:
                    val1, val2, val3 = float(parts_space[1]), float(parts_space[2]), float(parts_space[3])
                    if 0 <= val1 <= 90 and 0 <= val2 <= 360:  # 可能是纬度经度
                        detected_format = "geodetic_to_cartesian"
                    else:
                        detected_format = "cartesian_to_geodetic"
                except:
                    pass
            elif len(parts_space) == 3:
                detected_format = "gauss_projection"
        
        return {
            'total_lines': len(lines),
            'valid_lines': len(valid_lines),
            'empty_lines': len(lines) - len(valid_lines),
            'detected_format': detected_format,
            'sample_line': valid_lines[0] if valid_lines else ""
        }