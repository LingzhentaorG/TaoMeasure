"""
工程测量软件后端API服务
提供GPS高程转换、坐标转换、曲线测设等功能的REST API接口
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import traceback
import logging
from datetime import datetime

# 导入计算模块
from gps_altitude import GPSAltitudeConverter
from coordinate_transform import CoordinateTransform
from curve_design import CurveDesign
from file_handler import FileHandler
from curve_dxf_builder import CurveDxfBuilder

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
CORS(app)  # 启用跨域支持

# 初始化计算模块
gps_converter = GPSAltitudeConverter()
coord_transformer = CoordinateTransform()
curve_designer = CurveDesign()
file_handler = FileHandler()


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0',
        'modules': {
            'gps_altitude': 'available',
            'coordinate_transform': 'available',
            'curve_design': 'available'
        }
    })


@app.route('/api/gps-altitude', methods=['POST'])
def gps_altitude_conversion():
    """GPS高程转换接口"""
    try:
        data = request.get_json()
        
        # 验证输入数据
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        known_points = data.get('known_points', [])
        unknown_points = data.get('unknown_points', [])
        model = data.get('model', 'vertical_translation')
        model_params = data.get('model_params', {})
        
        if not known_points:
            return jsonify({'error': '请提供至少一个已知点'}), 400
        
        if not unknown_points:
            return jsonify({'error': '请提供至少一个未知点'}), 400
        
        logger.info(f"GPS高程转换请求: 模型={model}, 已知点={len(known_points)}, 未知点={len(unknown_points)}")
        
        # 执行计算
        if model == 'vertical_translation':
            result = gps_converter.vertical_translation_model(known_points, unknown_points)
        elif model == 'linear_basis':
            result = gps_converter.linear_basis_fitting(known_points, unknown_points, model_params)
        elif model == 'surface_basis':
            result = gps_converter.surface_basis_fitting(known_points, unknown_points, model_params)
        else:
            return jsonify({'error': f'不支持的模型类型: {model}'}), 400
        
        logger.info(f"GPS高程转换完成: 单位权中误差={result.get('unit_weight_error', 0):.3f}")
        
        return jsonify({
            'success': True,
            'data': result.get('results', []),
            'model': model,
            'known_points_count': len(known_points),
            'unknown_points_count': len(unknown_points),
            'unit_weight_error': result.get('unit_weight_error', 0),
            'max_residual': result.get('max_residual', 0),
            'min_residual': result.get('min_residual', 0),
            'parameters': result.get('parameters', {}),
            'accuracy_assessment': result.get('accuracy_assessment', {}),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"GPS高程转换错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/coordinate-transform', methods=['POST'])
def coordinate_transform():
    """坐标转换接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        operation = data.get('operation', data.get('type', 'forward'))
        
        # 支持嵌套的params对象
        params = data.get('params', {})
        central_meridian = params.get('central_meridian', data.get('central_meridian', 0))
        projection_height = params.get('projection_height', data.get('projection_height', 0))
        add_500km = params.get('add_500km', data.get('add_500km', True))
        ellipsoid = params.get('ellipsoid', data.get('ellipsoid', 'WGS84'))
        
        # 兼容不同的操作类型名称
        if operation == 'gauss_forward':
            transform_type = 'forward'
        elif operation == 'gauss_inverse':
            transform_type = 'inverse'
        else:
            transform_type = operation
        
        if not points:
            return jsonify({'error': '请提供至少一个坐标点'}), 400
        
        logger.info(f"坐标转换请求: 类型={transform_type}, 点数={len(points)}, 椭球={ellipsoid}")
        
        # 设置椭球参数
        coord_transformer.set_ellipsoid(ellipsoid)
        
        results = []
        
        for point in points:
            try:
                name = point.get('name', '')
                
                if transform_type == 'forward':
                    # 高斯投影正算
                    lat = point.get('lat') or point.get('coord1')
                    lon = point.get('lon') or point.get('coord2')
                    
                    # 处理度分秒格式
                    if isinstance(lat, str):
                        lat = coord_transformer.dms_to_decimal(lat)
                    if isinstance(lon, str):
                        lon = coord_transformer.dms_to_decimal(lon)
                    
                    x, y = coord_transformer.gauss_forward(
                        lat, lon, central_meridian, projection_height, add_500km
                    )
                    
                    results.append({
                        'name': name,
                        'input_lat': lat,
                        'input_lon': lon,
                        'output_x': x,
                        'output_y': y,
                        'lat_dms': coord_transformer.decimal_to_dms(lat),
                        'lon_dms': coord_transformer.decimal_to_dms(lon)
                    })
                    
                elif transform_type == 'inverse':
                    # 高斯投影反算
                    x = point.get('x') or point.get('coord1')
                    y = point.get('y') or point.get('coord2')
                    
                    lat, lon = coord_transformer.gauss_inverse(
                        x, y, central_meridian, projection_height, add_500km
                    )
                    
                    results.append({
                        'name': name,
                        'input_x': x,
                        'input_y': y,
                        'output_lat': lat,
                        'output_lon': lon,
                        'lat_dms': coord_transformer.decimal_to_dms(lat),
                        'lon_dms': coord_transformer.decimal_to_dms(lon)
                    })
                    
            except Exception as point_error:
                point_name = point.get('name', '')
                logger.error(f"处理点 {point_name} 时出错: {str(point_error)}")
                results.append({
                    'name': point_name,
                    'error': str(point_error)
                })
        
        logger.info(f"坐标转换完成: 成功处理 {len([r for r in results if 'error' not in r])} 个点")
        
        return jsonify({
            'success': True,
            'data': results,
            'transform_type': transform_type,
            'parameters': {
                'central_meridian': central_meridian,
                'projection_height': projection_height,
                'add_500km': add_500km,
                'ellipsoid': ellipsoid
            },
            'points_count': len(points),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"坐标转换错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/xyz-to-blh', methods=['POST'])
def xyz_to_blh():
    """空间直角坐标转大地坐标"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        ellipsoid = data.get('ellipsoid', 'WGS84')
        
        if not points:
            return jsonify({'error': '请提供至少一个坐标点'}), 400
        
        logger.info(f"XYZ→BLH转换请求: 点数={len(points)}, 椭球={ellipsoid}")
        
        # 设置椭球参数
        coord_transformer.set_ellipsoid(ellipsoid)
        
        results = []
        
        for point in points:
            try:
                name = point.get('name', '')
                x = point.get('x') or point.get('coord1')
                y = point.get('y') or point.get('coord2')
                z = point.get('z') or point.get('coord3')
                
                B, L, H = coord_transformer.xyz_to_blh(x, y, z)
                
                results.append({
                    'name': name,
                    'input_x': x,
                    'input_y': y,
                    'input_z': z,
                    'output_B': B,
                    'output_L': L,
                    'output_H': H,
                    'B_dms': coord_transformer.decimal_to_dms(B),
                    'L_dms': coord_transformer.decimal_to_dms(L)
                })
                
            except Exception as point_error:
                point_name = point.get('name', '')
                logger.error(f"处理点 {point_name} 时出错: {str(point_error)}")
                results.append({
                    'name': point_name,
                    'error': str(point_error)
                })
        
        return jsonify({
            'success': True,
            'data': results,
            'ellipsoid': ellipsoid,
            'points_count': len(points),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"XYZ→BLH转换错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/blh-to-xyz', methods=['POST'])
def blh_to_xyz():
    """大地坐标转空间直角坐标"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        ellipsoid = data.get('ellipsoid', 'WGS84')
        
        if not points:
            return jsonify({'error': '请提供至少一个坐标点'}), 400
        
        logger.info(f"BLH→XYZ转换请求: 点数={len(points)}, 椭球={ellipsoid}")
        
        # 设置椭球参数
        coord_transformer.set_ellipsoid(ellipsoid)
        
        results = []
        
        for point in points:
            try:
                name = point.get('name', '')
                B = point.get('B') or point.get('coord1')
                L = point.get('L') or point.get('coord2')
                H = point.get('H') or point.get('coord3')
                
                # 处理度分秒格式
                if isinstance(B, str):
                    B = coord_transformer.dms_to_decimal(B)
                if isinstance(L, str):
                    L = coord_transformer.dms_to_decimal(L)
                
                x, y, z = coord_transformer.blh_to_xyz(B, L, H)
                
                results.append({
                    'name': name,
                    'input_B': B,
                    'input_L': L,
                    'input_H': H,
                    'output_x': x,
                    'output_y': y,
                    'output_z': z,
                    'B_dms': coord_transformer.decimal_to_dms(B),
                    'L_dms': coord_transformer.decimal_to_dms(L)
                })
                
            except Exception as point_error:
                point_name = point.get('name', '')
                logger.error(f"处理点 {point_name} 时出错: {str(point_error)}")
                results.append({
                    'name': point_name,
                    'error': str(point_error)
                })
        
        return jsonify({
            'success': True,
            'data': results,
            'ellipsoid': ellipsoid,
            'points_count': len(points),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"BLH→XYZ转换错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/four-parameter-transform', methods=['POST'])
def four_parameter_transform():
    """四参数转换 - 支持参数解算和坐标转换"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        control_points = data.get('control_points', []) or data.get('common_points', [])  # 兼容两种字段名
        operation_type = data.get('operation_type', 'transform')  # 新增：操作类型，transform 或 calculate_params
        
        # 参数解算模式
        if operation_type == 'calculate_params':
            logger.info(f"接收到的控制点数据: {control_points}")
            if len(control_points) < 2:
                return jsonify({'error': '四参数转换至少需要2个控制点'}), 400
            
            logger.info(f"四参数解算请求: 控制点={len(control_points)}")
            
            from coordinate_transformations import calculate_four_parameters
            
            # 准备控制点对
            control_pairs = []
            for cp in control_points:
                source_point = (cp['source_x'], cp['source_y'])
                target_point = (cp['target_x'], cp['target_y'])
                control_pairs.append((source_point, target_point))
            
            # 计算四参数
            dx, dy, alpha, m = calculate_four_parameters(control_pairs)
            
            return jsonify({
                'success': True,
                'parameters': {
                    'dx': dx,
                    'dy': dy,
                    'alpha': alpha,
                    'm': m
                },
                'control_points_count': len(control_points),
                'timestamp': datetime.now().isoformat()
            })
        
        # 坐标转换模式（原有逻辑）
        elif operation_type == 'transform':
            if not points:
                return jsonify({'error': '请提供待转换点'}), 400
            
            if len(control_points) < 2:
                return jsonify({'error': '四参数转换至少需要2个控制点'}), 400
            
            logger.info(f"四参数转换请求: 待转换点={len(points)}, 控制点={len(control_points)}")
            
            from coordinate_transformations import calculate_four_parameters, four_parameter_transform
            
            # 准备控制点对
            control_pairs = []
            for cp in control_points:
                source_point = (cp['source_x'], cp['source_y'])
                target_point = (cp['target_x'], cp['target_y'])
                control_pairs.append((source_point, target_point))
            
            # 计算四参数
            dx, dy, alpha, m = calculate_four_parameters(control_pairs)
            
            # 准备待转换点
            points_to_transform = [(p['x'], p['y']) for p in points]
            
            # 执行转换
            transformed_points = four_parameter_transform(points_to_transform, dx, dy, alpha, m)
            
            # 准备结果
            results = []
            for i, (name, (x_new, y_new)) in enumerate(zip([p.get('name', '') for p in points], transformed_points)):
                results.append({
                    'name': name,
                    'original_x': points[i]['x'],
                    'original_y': points[i]['y'],
                    'transformed_x': x_new,
                    'transformed_y': y_new
                })
            
            return jsonify({
                'success': True,
                'data': results,
                'parameters': {
                    'dx': dx,
                    'dy': dy,
                    'alpha': alpha,
                    'm': m
                },
                'control_points_count': len(control_points),
                'points_count': len(points),
                'timestamp': datetime.now().isoformat()
            })
        
        else:
            return jsonify({'error': f'不支持的操作类型: {operation_type}'}), 400
        
    except Exception as e:
        logger.error(f"四参数转换错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/four-param-transform', methods=['POST'])
def four_param_transform():
    """四参数正算转换接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        operation = data.get('operation', '')
        points = data.get('points', [])
        settings = data.get('settings', {})
        
        if not points:
            return jsonify({'error': '请提供待转换点'}), 400
        
        if operation == 'four_param_forward':
            # 四参数正算
            dx = settings.get('deltaX', 0)
            dy = settings.get('deltaY', 0)
            alpha = settings.get('rotation', 0)  # 弧度
            m = settings.get('scale', 0)
            coord_decimals = settings.get('coordDecimals', 3)
            
            logger.info(f"四参数正算请求: 点数={len(points)}, 参数=dx:{dx}, dy:{dy}, alpha:{alpha}, m:{m}")
            
            from coordinate_transformations import four_parameter_transform
            
            # 准备待转换点
            points_to_transform = [(p['x'], p['y']) for p in points]
            
            # 执行转换
            transformed_points = four_parameter_transform(points_to_transform, dx, dy, alpha, m)
            
            # 准备结果
            results = []
            for i, (name, (x_new, y_new)) in enumerate(zip([p.get('name', '') for p in points], transformed_points)):
                # 计算坐标增量
                delta_x = x_new - points[i]['x']
                delta_y = y_new - points[i]['y']
                
                results.append({
                    'name': name,
                    'x': points[i]['x'],
                    'y': points[i]['y'],
                    'newX': round(x_new, coord_decimals),
                    'newY': round(y_new, coord_decimals),
                    'deltaX': round(delta_x, coord_decimals),
                    'deltaY': round(delta_y, coord_decimals)
                })
            
            return jsonify({
                'success': True,
                'results': results,
                'parameters': {
                    'deltaX': dx,
                    'deltaY': dy,
                    'rotation': alpha,
                    'scale': m
                },
                'points_count': len(points),
                'timestamp': datetime.now().isoformat()
            })
            
        else:
            return jsonify({'error': f'不支持的操作类型: {operation}'}), 400
        
    except Exception as e:
        logger.error(f"四参数正算错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/seven-parameter-transform', methods=['POST'])
def seven_parameter_transform():
    """七参数转换"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        control_points = data.get('control_points', [])
        
        if not points:
            return jsonify({'error': '请提供待转换点'}), 400
        
        if len(control_points) < 3:
            return jsonify({'error': '七参数转换至少需要3个控制点'}), 400
        
        logger.info(f"七参数转换请求: 待转换点={len(points)}, 控制点={len(control_points)}")
        
        from coordinate_transformations import calculate_seven_parameters, seven_parameter_transform
        
        # 准备控制点对
        control_pairs = []
        for cp in control_points:
            source_point = (cp['source_x'], cp['source_y'], cp['source_z'])
            target_point = (cp['target_x'], cp['target_y'], cp['target_z'])
            control_pairs.append((source_point, target_point))
        
        # 计算七参数
        dx, dy, dz, rx, ry, rz, m = calculate_seven_parameters(control_pairs)
        
        # 准备待转换点
        points_to_transform = [(p['x'], p['y'], p['z']) for p in points]
        
        # 执行转换
        transformed_points = seven_parameter_transform(points_to_transform, dx, dy, dz, rx, ry, rz, m)
        
        # 准备结果
        results = []
        for i, (name, (x_new, y_new, z_new)) in enumerate(zip([p.get('name', '') for p in points], transformed_points)):
            results.append({
                'name': name,
                'original_x': points[i]['x'],
                'original_y': points[i]['y'],
                'original_z': points[i]['z'],
                'transformed_x': x_new,
                'transformed_y': y_new,
                'transformed_z': z_new
            })
        
        return jsonify({
            'success': True,
            'data': results,
            'parameters': {
                'dx': dx,
                'dy': dy,
                'dz': dz,
                'rx': rx,
                'ry': ry,
                'rz': rz,
                'm': m
            },
            'control_points_count': len(control_points),
            'points_count': len(points),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"七参数转换错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/curve-design', methods=['POST'])
def curve_design():
    """曲线测设接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        curve_type = data.get('curve_type', 'transition')
        parameters = data.get('parameters', {})
        
        logger.info(f"曲线测设请求: 类型={curve_type}")
        
        # 根据曲线类型调用相应的计算方法
        if curve_type == 'transition':
            result = curve_designer.transition_curve_design(parameters)
        elif curve_type == 'circular':
            result = curve_designer.circular_curve_design(parameters)
        elif curve_type == 'compound':
            result = curve_designer.compound_curve_design(parameters)
        else:
            return jsonify({'error': f'不支持的曲线类型: {curve_type}'}), 400
        
        logger.info(f"曲线测设完成: 类型={curve_type}")
        
        return jsonify({
            'success': True,
            'data': result,
            'curve_type': curve_type,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"曲线测设错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.route('/api/zone-transform', methods=['POST'])
def zone_transform():
    """换带变换接口"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': '请提供有效的JSON数据'}), 400
        
        points = data.get('points', [])
        transform_type = data.get('type', '3to6')  # '3to6' 或 '6to3'
        source_elevation = data.get('sourceElevation', 0)  # 换带前投影面大地高
        target_elevation = data.get('targetElevation', 0)  # 换带后投影面大地高
        
        if not points:
            return jsonify({'error': '请提供至少一个坐标点'}), 400
        
        logger.info(f"换带变换请求: 类型={transform_type}, 点数={len(points)}, 源大地高={source_elevation}, 目标大地高={target_elevation}")
        
        results = []
        
        for point in points:
            try:
                name = point.get('name', '')
                x = point.get('x')
                y = point.get('y')
                height = point.get('height', 0)  # 原始大地高
                zone = point.get('zone')
                
                # 执行换带变换
                if transform_type == '3to6':
                    x_new, y_new, zone_new = coord_transformer.zone_transform_3_to_6(x, y, zone)
                elif transform_type == '6to3':
                    x_new, y_new, zone_new = coord_transformer.zone_transform_6_to_3(x, y, zone)
                else:
                    raise ValueError(f'不支持的换带类型: {transform_type}')
                
                # 大地高处理：如果用户输入了换带前后的大地高，则使用新的大地高；否则照抄原大地高
                if source_elevation != 0 or target_elevation != 0:
                    # 用户输入了大地高数值，使用目标投影面的大地高
                    new_height = target_elevation
                else:
                    # 用户未输入大地高，照抄原大地高
                    new_height = height
                
                results.append({
                    'name': name,
                    'input_x': x,
                    'input_y': y,
                    'input_height': height,
                    'input_zone': zone,
                    'output_x': x_new,
                    'output_y': y_new,
                    'output_height': new_height,
                    'output_zone': zone_new
                })
                
            except Exception as point_error:
                point_name = point.get('name', '')
                logger.error(f"处理点 {point_name} 时出错: {str(point_error)}")
                results.append({
                    'name': point_name,
                    'error': str(point_error)
                })
        
        return jsonify({
            'success': True,
            'data': results,
            'transform_type': transform_type,
            'source_elevation': source_elevation,
            'target_elevation': target_elevation,
            'points_count': len(points),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"换带变换错误: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@app.errorhandler(404)
def not_found(error):
    """404错误处理"""
    return jsonify({
        'success': False,
        'error': '接口不存在',
        'timestamp': datetime.now().isoformat()
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """405错误处理"""
    return jsonify({
        'success': False,
        'error': '请求方法不允许',
        'timestamp': datetime.now().isoformat()
    }), 405


@app.route('/api/file/parse', methods=['POST'])
def parse_coordinate_file():
    """解析坐标文件接口"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data or 'type' not in data:
            return jsonify({
                'success': False,
                'error': '缺少必要参数：content和type'
            }), 400
        
        file_content = data['content']
        file_type = data['type']
        
        # 验证文件格式
        is_valid, error_msg = file_handler.validate_file_format(file_content, file_type)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': f'文件格式错误：{error_msg}'
            }), 400
        
        # 解析文件
        result = file_handler.parse_coordinate_file(file_content, file_type)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"文件解析错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'文件解析失败：{str(e)}'
        }), 500


@app.errorhandler(500)
def internal_error(error):
    """500错误处理"""
    return jsonify({
        'success': False,
        'error': '服务器内部错误',
        'timestamp': datetime.now().isoformat()
    }), 500


@app.route('/api/coordinate/batch/geodetic-to-cartesian', methods=['POST'])
def batch_geodetic_to_cartesian():
    """批量大地坐标转空间直角坐标"""
    try:
        data = request.get_json()
        
        if not data or 'points' not in data:
            return jsonify({
                'success': False,
                'error': '缺少必要参数：points'
            }), 400
        
        points = data['points']
        ellipsoid = data.get('ellipsoid', 'WGS84')
        
        # 设置椭球参数
        coord_transformer.set_ellipsoid(ellipsoid)
        
        results = []
        for point in points:
            try:
                x, y, z = coord_transformer.blh_to_xyz(
                    point['lat'], point['lon'], point['height']
                )
                results.append({
                    'name': point['name'],
                    'lat': point['lat'],
                    'lon': point['lon'],
                    'height': point['height'],
                    'x': x,
                    'y': y,
                    'z': z
                })
            except Exception as e:
                logger.error(f"转换点 {point.get('name', 'unknown')} 失败: {str(e)}")
                results.append({
                    'name': point.get('name', 'unknown'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'ellipsoid': ellipsoid,
                'count': len(results)
            }
        })
        
    except Exception as e:
        logger.error(f"批量大地坐标转空间直角坐标错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'批量转换失败：{str(e)}'
        }), 500


@app.route('/api/coordinate/batch/cartesian-to-geodetic', methods=['POST'])
def batch_cartesian_to_geodetic():
    """批量空间直角坐标转大地坐标"""
    try:
        data = request.get_json()
        
        if not data or 'points' not in data:
            return jsonify({
                'success': False,
                'error': '缺少必要参数：points'
            }), 400
        
        points = data['points']
        ellipsoid = data.get('ellipsoid', 'WGS84')
        
        # 设置椭球参数
        coord_transformer.set_ellipsoid(ellipsoid)
        
        results = []
        for point in points:
            try:
                lat, lon, height = coord_transformer.xyz_to_blh(
                    point['x'], point['y'], point['z']
                )
                results.append({
                    'name': point['name'],
                    'x': point['x'],
                    'y': point['y'],
                    'z': point['z'],
                    'lat': lat,
                    'lon': lon,
                    'height': height
                })
            except Exception as e:
                logger.error(f"转换点 {point.get('name', 'unknown')} 失败: {str(e)}")
                results.append({
                    'name': point.get('name', 'unknown'),
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'results': results,
                'ellipsoid': ellipsoid,
                'count': len(results)
            }
        })
        
    except Exception as e:
        logger.error(f"批量空间直角坐标转大地坐标错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'批量转换失败：{str(e)}'
        }), 500


@app.route('/api/export/results', methods=['POST'])
def export_results():
    """导出计算结果"""
    try:
        data = request.get_json()
        
        if not data or 'results' not in data or 'format' not in data or 'type' not in data:
            return jsonify({
                'success': False,
                'error': '缺少必要参数：results, format, type'
            }), 400
        
        results = data['results']
        export_format = data['format']  # 'txt' or 'csv'
        result_type = data['type']
        
        if export_format == 'txt':
            content = file_handler.export_results_to_text(results, result_type)
            content_type = 'text/plain'
        elif export_format == 'csv':
            content = file_handler.export_results_to_csv(results, result_type)
            content_type = 'text/csv'
        else:
            return jsonify({
                'success': False,
                'error': '不支持的导出格式'
            }), 400
        
        return jsonify({
            'success': True,
            'data': {
                'content': content,
                'content_type': content_type,
                'filename': f'results_{result_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.{export_format}'
            }
        })
        
    except Exception as e:
        logger.error(f"导出结果错误: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'导出失败：{str(e)}'
        }), 500


@app.route('/api/export/dxf', methods=['POST'])
def export_dxf():
    """Export curve design results to a DXF file"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'missing request payload'}), 400

        from dxf_exporter import DxfRoadExporter
        import tempfile
        import os
        from flask import after_this_request

        try:
            builder = CurveDxfBuilder(data)
            exporter_data = builder.build()
        except ValueError as exc:
            logger.error(f'DXF payload validation failed: {exc}')
            return jsonify({'success': False, 'error': f'DXF payload invalid: {exc}'}), 400

        layer_overrides = {
            'frame_outer': '图框',
            'frame_inner': '图内框',
            'north_arrow': '指北针',
            'centerline': '道路中线',
            'left_lane': '左车道',
            'right_lane': '右车道',
            'left_roadbed_edge': '左路基边线',
            'right_roadbed_edge': '右路基边线',
            'pi_line': '路线',
            'key_point': '关键点',
            'hm_stake': '桩号',
            'curve_table': '曲线要素表',
        }

        exporter = DxfRoadExporter(layer_overrides=layer_overrides)
        exporter.draw_from_data(exporter_data)

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.dxf')
        tmpfile_path = tmp_file.name
        tmp_file.close()
        exporter.save(tmpfile_path)

        @after_this_request
        def _cleanup(response):
            try:
                os.remove(tmpfile_path)
            except OSError:
                pass
            return response

        filename_root = getattr(builder, 'project_name', 'curve_design') or 'curve_design'
        safe_root = ''.join(ch if ch.isalnum() or ch in ('_', '-', ' ') else '_' for ch in filename_root)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'{safe_root}_{timestamp}.dxf'
        return send_file(
            tmpfile_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.dxf'
        )

    except Exception as e:
        logger.error(f'DXF export failed: {str(e)}')
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'DXF导出失败：{str(e)}'
        }), 500


if __name__ == '__main__':
    logger.info("启动工程测量软件后端服务...")
    logger.info("可用接口:")
    logger.info("  GET  /api/health - 健康检查")
    logger.info("  POST /api/gps-altitude - GPS高程转换")
    logger.info("  POST /api/coordinate-transform - 坐标转换")
    logger.info("  POST /api/xyz-to-blh - XYZ→BLH转换")
    logger.info("  POST /api/blh-to-xyz - BLH→XYZ转换")
    logger.info("  POST /api/four-parameter-transform - 四参数转换")
    logger.info("  POST /api/seven-parameter-transform - 七参数转换")
    logger.info("  POST /api/curve-design - 曲线测设")
    logger.info("  POST /api/zone-transform - 换带变换")
    
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True,
        threaded=True
    )

