import numpy as np

def xyz_to_blh(X, Y, Z, a=6378137.0, f=1/298.257223563):
    """
    空间直角坐标(X,Y,Z)转换为大地坐标(B,L,H)
    
    参数:
    X, Y, Z : 空间直角坐标
    a : 椭球长半轴
    f : 椭球扁率
    
    返回:
    B : 大地纬度(弧度)
    L : 大地经度(弧度)
    H : 大地高(米)
    """
    e2 = 2*f - f**2  # 第一偏心率平方
    
    # 计算经度
    L = np.arctan2(Y, X)
    
    # 计算辅助量
    p = np.sqrt(X**2 + Y**2)
    
    # 迭代计算纬度和大地高
    B = np.arctan2(Z, p)  # 初始值
    H = 0
    for i in range(10):  # 最多迭代10次
        B_prev = B
        N = a / np.sqrt(1 - e2 * np.sin(B)**2)
        H = p / np.cos(B) - N
        B = np.arctan2(Z, p * (1 - e2 * N / (N + H)))
        if abs(B - B_prev) < 1e-12:
            break
    
    N = a / np.sqrt(1 - e2 * np.sin(B)**2)
    H = p / np.cos(B) - N
    
    return B, L, H

def blh_to_xyz(B, L, H, a=6378137.0, f=1/298.257223563):
    """
    大地坐标(B,L,H)转换为空间直角坐标(X,Y,Z)
    
    参数:
    B : 大地纬度(弧度)
    L : 大地经度(弧度)
    H : 大地高(米)
    a : 椭球长半轴
    f : 椭球扁率
    
    返回:
    X, Y, Z : 空间直角坐标
    """
    e2 = 2*f - f**2  # 第一偏心率平方
    N = a / np.sqrt(1 - e2 * np.sin(B)**2)  # 卯酉圈半径
    
    X = (N + H) * np.cos(B) * np.cos(L)
    Y = (N + H) * np.cos(B) * np.sin(L)
    Z = (N * (1 - e2) + H) * np.sin(B)
    
    return X, Y, Z

def four_parameter_transform(points, dx, dy, alpha, m):
    """
    四参数坐标转换（平面坐标转换）
    
    参数:
    points : 待转换点列表 [(x1, y1), (x2, y2), ...]
    dx, dy : 平移参数
    alpha : 旋转角度(弧度)
    m : 尺度参数
    
    返回:
    transformed_points : 转换后的点列表
    """
    cos_a = np.cos(alpha)
    sin_a = np.sin(alpha)
    
    transformed_points = []
    for x, y in points:
        x2 = dx + (1 + m) * (x * cos_a - y * sin_a)
        y2 = dy + (1 + m) * (x * sin_a + y * cos_a)
        transformed_points.append((x2, y2))
    
    return transformed_points

def seven_parameter_transform(points, dx, dy, dz, rx, ry, rz, m):
    """
    七参数坐标转换（空间坐标转换）
    
    参数:
    points : 待转换点列表 [(x1, y1, z1), (x2, y2, z2), ...]
    dx, dy, dz : 平移参数
    rx, ry, rz : 旋转参数(弧度)
    m : 尺度参数
    
    返回:
    transformed_points : 转换后的点列表
    """
    transformed_points = []
    for x, y, z in points:
        # 应用七参数转换公式（布尔莎模型）
        # X' = dx + (1+m) * (X + Rz*Y - Ry*Z)
        # Y' = dy + (1+m) * (-Rz*X + Y + Rx*Z)
        # Z' = dz + (1+m) * (Ry*X - Rx*Y + Z)
        
        scale_factor = 1 + m
        
        x_new = dx + scale_factor * (x + rz*y - ry*z)
        y_new = dy + scale_factor * (-rz*x + y + rx*z)
        z_new = dz + scale_factor * (ry*x - rx*y + z)
        
        transformed_points.append((x_new, y_new, z_new))
    
    return transformed_points

def calculate_four_parameters(common_points):
    """
    根据公共点计算四参数
    
    参数:
    common_points : 公共点列表 [((x1_source, y1_source), (x1_target, y1_target)), ...]
    
    返回:
    dx, dy, alpha, m : 四参数
    """
    n = len(common_points)
    if n < 2:
        raise ValueError("至少需要2个公共点来计算四参数")
    
    # 构造系数矩阵和常数项
    A = np.zeros((2*n, 4))
    b = np.zeros(2*n)
    
    for i, ((x_src, y_src), (x_tgt, y_tgt)) in enumerate(common_points):
        A[2*i, :] = [1, 0, x_src, -y_src]
        A[2*i+1, :] = [0, 1, y_src, x_src]
        b[2*i] = x_tgt
        b[2*i+1] = y_tgt
    
    # 最小二乘解算
    params = np.linalg.lstsq(A, b, rcond=None)[0]
    
    dx = params[0]
    dy = params[1]
    m = np.sqrt(params[2]**2 + params[3]**2) - 1
    alpha = np.arctan2(params[3], params[2])
    
    return dx, dy, alpha, m

def calculate_seven_parameters(common_points):
    """
    根据公共点计算七参数
    
    参数:
    common_points : 公共点列表 [((x1_source, y1_source, z1_source), (x1_target, y1_target, z1_target)), ...]
    
    返回:
    dx, dy, dz, rx, ry, rz, m : 七参数
    """
    n = len(common_points)
    if n < 3:
        raise ValueError("至少需要3个公共点来计算七参数")
    
    # 使用迭代的线性最小二乘法计算七参数
    # 初始参数估计（假设没有旋转和尺度变化）
    dx0, dy0, dz0 = 0, 0, 0
    rx0, ry0, rz0 = 0, 0, 0
    m0 = 0
    
    # 计算初始平移参数
    total_dx, total_dy, total_dz = 0, 0, 0
    for (x_src, y_src, z_src), (x_tgt, y_tgt, z_tgt) in common_points:
        total_dx += x_tgt - x_src
        total_dy += y_tgt - y_src
        total_dz += z_tgt - z_src
    
    dx0 = total_dx / n
    dy0 = total_dy / n
    dz0 = total_dz / n
    
    # 迭代优化参数
    max_iterations = 10
    tolerance = 1e-8
    
    for iteration in range(max_iterations):
        # 构造系数矩阵和常数项
        A = np.zeros((3*n, 7))
        b = np.zeros(3*n)
        
        for i, ((x_src, y_src, z_src), (x_tgt, y_tgt, z_tgt)) in enumerate(common_points):
            # 使用当前参数转换源点
            transformed = seven_parameter_transform([(x_src, y_src, z_src)], dx0, dy0, dz0, rx0, ry0, rz0, m0)
            x_trans, y_trans, z_trans = transformed[0]
            
            # 计算残差
            dx_res = x_tgt - x_trans
            dy_res = y_tgt - y_trans
            dz_res = z_tgt - z_trans
            
            # 构造线性化方程（基于当前转换点的偏导数）
            A[3*i, :] = [1, 0, 0, 0, -z_trans, y_trans, x_trans]
            A[3*i+1, :] = [0, 1, 0, z_trans, 0, -x_trans, y_trans]
            A[3*i+2, :] = [0, 0, 1, -y_trans, x_trans, 0, z_trans]
            b[3*i] = dx_res
            b[3*i+1] = dy_res
            b[3*i+2] = dz_res
        
        # 解算参数增量
        deltas = np.linalg.lstsq(A, b, rcond=None)[0]
        
        # 更新参数
        dx0 += deltas[0]
        dy0 += deltas[1]
        dz0 += deltas[2]
        rx0 += deltas[3]
        ry0 += deltas[4]
        rz0 += deltas[5]
        m0 += deltas[6]
        
        # 检查收敛性
        if np.linalg.norm(deltas) < tolerance:
            break
    
    return dx0, dy0, dz0, rx0, ry0, rz0, m0