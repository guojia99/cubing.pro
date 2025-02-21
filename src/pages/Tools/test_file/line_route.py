import math

# 给定的中心点
cx, cy = 35.01322, 38.0901
angle = math.radians(105)  # 角度转换为弧度
half_length = 38  # 线段的一半长度

# 计算偏移量
dx = math.cos(angle) * half_length
dy = math.sin(angle) * half_length

# 计算起点和终点
x1, y1 = cx - dx, cy - dy
x2, y2 = cx + dx, cy + dy

# 输出 SVG path 坐标
print(f'<path d="M {x1:.5f} {y1:.5f} L {x2:.5f} {y2:.5f}" stroke="black" stroke-width="1" fill="none"/>')

