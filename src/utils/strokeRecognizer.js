/**
 * strokeRecognizer.js
 * Hệ thống Nhận diện Hình học Toán học & Quy tắc Dựng hình Thông minh cho Giáo viên
 *
 * Cải tiến cốt lõi:
 * 1. Scale-Invariant Corner Detection: Phát hiện đỉnh góc bất biến theo tỉ lệ kích thước hình,
 *    cắt bỏ râu thừa ở đầu/cuối nét bút (pen-down / pen-up hook removal) và gộp đoạn thẳng đồng phương.
 * 2. Topological Vertex-Edge Graph Clustering: Gom cụm các đầu mút đoạn thẳng từ 1 hoặc nhiều nét vẽ
 *    thành đồ thị Đỉnh - Cạnh (V, E). Nhờ đó giáo viên vẽ 1 nét liền hay vẽ rời 2, 3, 4, N nét đều nhận diện chính xác.
 * 3. Phân loại 16+ loại hình Toán phổ thông (2D & 3D):
 *    - 2D: Tam giác vuông, Tam giác cân, Tam giác đều, Tam giác thường, Hình vuông, Hình chữ nhật,
 *          Hình thoi, Hình bình hành, Hình thang vuông, Hình thang cân, Hình thang, Ngũ giác, Lục giác đều,
 *          Đường tròn, Elip, Đường tròn ngoại tiếp tam giác.
 *    - 3D: Hình lập phương / Hình hộp ABCD.A'B'C'D', Hình chóp S.ABCD có SA ⊥ (ABCD),
 *          Hình chóp tứ giác đều S.ABCD, Tứ diện / Chóp tam giác S.ABC, Lăng trụ tam giác ABC.A'B'C',
 *          Hình trụ, Hình nón.
 * 4. Chế độ "Hình bài tập tự do" (Custom Topological Graph): Nếu giáo viên vẽ một hình bài tập phức tạp
 *    (ví dụ tam giác có sẵn đường cao, trung tuyến, hoặc đa giác ghép), hệ thống giữ nguyên cấu trúc đỉnh-cạnh
 *    của giáo viên, nắn thẳng từng đoạn, tự bắt dính các đỉnh giao nhau và tự động nhận diện góc vuông!
 */

/** Khoảng cách Euclid giữa 2 điểm */
export function dist(a, b) {
  if (!a || !b) return 0
  return Math.hypot((a.nx || 0) - (b.nx || 0), (a.ny || 0) - (b.ny || 0))
}

/** Độ dài đường gấp khúc */
export function polylineLength(pts) {
  if (!pts || pts.length < 2) return 0
  let len = 0
  for (let i = 1; i < pts.length; i += 1) {
    len += dist(pts[i - 1], pts[i])
  }
  return len
}

/** Bounding box của tập điểm */
export function boundingBox(pts) {
  if (!pts || !pts.length) {
    return { minX: 0.25, maxX: 0.65, minY: 0.25, maxY: 0.65, width: 0.4, height: 0.4, cx: 0.45, cy: 0.45 }
  }
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of pts) {
    if (!p) continue
    if (p.nx < minX) minX = p.nx
    if (p.nx > maxX) maxX = p.nx
    if (p.ny < minY) minY = p.ny
    if (p.ny > maxY) maxY = p.ny
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0.25, maxX: 0.65, minY: 0.25, maxY: 0.65, width: 0.4, height: 0.4, cx: 0.45, cy: 0.45 }
  }
  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(1e-4, maxX - minX),
    height: Math.max(1e-4, maxY - minY),
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  }
}

/**
 * Làm sạch và chuẩn hóa chuỗi công thức / phương trình toán học từ chữ viết tay hoặc LaTeX
 * sang biểu thức hàm số có thể tính toán trực tiếp với biến x (ví dụ: "y = 2x - 3" -> "2x - 3")
 */
export function cleanFormulaFromText(raw) {
  let text = String(raw || '').trim()
  if (!text) return ''

  // Bỏ ký tự $...$ hoặc \(...\) của KaTeX/LaTeX
  text = text.replace(/^\$+|\$+$/g, '').replace(/^\\\(|\\\)$/g, '').trim()

  // Bỏ các tiền tố như "y =", "f(x) =", "g(x) =", "y' ="
  const eqIdx = text.indexOf('=')
  if (eqIdx !== -1) {
    const lhs = text.slice(0, eqIdx).trim().toLowerCase()
    if (lhs === 'y' || lhs === 'f(x)' || lhs === 'g(x)' || lhs === 'y(x)' || lhs === 'fx' || lhs === 'y1' || lhs === 'y2') {
      text = text.slice(eqIdx + 1).trim()
    }
  }

  // Chuẩn hóa ký hiệu toán học phổ biến sang biểu thức JS
  text = text
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot/g, '*')
    .replace(/\\times/g, '*')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tan/g, 'tan')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\sqrt\(([^)]+)\)/g, 'sqrt($1)')
    .replace(/\\pi/g, 'pi')
    .replace(/[{}]/g, '')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/⁴/g, '^4')
    .replace(/−/g, '-')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .trim()

  return text
}

function distToSegment(p, a, b) {
  const dx = b.nx - a.nx
  const dy = b.ny - a.ny
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return dist(p, a)
  let t = ((p.nx - a.nx) * dx + (p.ny - a.ny) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { nx: a.nx + t * dx, ny: a.ny + t * dy })
}

/** Ramer-Douglas-Peucker (RDP) đơn giản hóa đường nét */
export function ramerDouglasPeucker(pts, epsilon = 0.015) {
  if (!pts || pts.length <= 2) return pts || []
  let dmax = 0
  let index = 0
  const first = pts[0]
  const last = pts[pts.length - 1]

  for (let i = 1; i < pts.length - 1; i += 1) {
    const d = distToSegment(pts[i], first, last)
    if (d > dmax) {
      index = i
      dmax = d
    }
  }

  if (dmax > epsilon) {
    const rec1 = ramerDouglasPeucker(pts.slice(0, index + 1), epsilon)
    const rec2 = ramerDouglasPeucker(pts.slice(index), epsilon)
    return [...rec1.slice(0, -1), ...rec2]
  }
  return [first, last]
}

/** Góc giữa 3 điểm A - B - C (đỉnh tại B, đơn vị radian) */
export function angleBetween(a, b, c) {
  const v1x = a.nx - b.nx
  const v1y = a.ny - b.ny
  const v2x = c.nx - b.nx
  const v2y = c.ny - b.ny
  const m1 = Math.hypot(v1x, v1y)
  const m2 = Math.hypot(v2x, v2y)
  if (m1 < 1e-8 || m2 < 1e-8) return Math.PI
  const cos = Math.max(-1, Math.min(1, (v1x * v2x + v1y * v2y) / (m1 * m2)))
  return Math.acos(cos)
}

/** Góc của vector AB theo độ [0, 180) (không hướng) */
function segmentAngleDeg180(a, b) {
  let deg = (Math.atan2(b.ny - a.ny, b.nx - a.nx) * 180) / Math.PI
  if (deg < 0) deg += 180
  if (deg >= 180) deg -= 180
  return deg
}

/** Kiểm tra 2 đoạn có song song không (sai số <= tolDeg) */
function areParallel(a1, a2, b1, b2, tolDeg = 16) {
  const d1 = segmentAngleDeg180(a1, a2)
  const d2 = segmentAngleDeg180(b1, b2)
  const diff = Math.abs(d1 - d2)
  return diff <= tolDeg || Math.abs(diff - 180) <= tolDeg
}

/** Kiểm tra 2 đoạn có vuông góc không (sai số <= tolDeg) */
function arePerpendicular(a1, a2, b1, b2, tolDeg = 16) {
  const d1 = segmentAngleDeg180(a1, a2)
  const d2 = segmentAngleDeg180(b1, b2)
  const diff = Math.abs(d1 - d2)
  return Math.abs(diff - 90) <= tolDeg
}

/**
 * Làm sạch và tách các đỉnh góc chuẩn xác từ 1 nét vẽ (Scale-Invariant Corner Extractor):
 * - Cắt bỏ móc nhỏ ở đầu/cuối nét khi đặt/nhấc bút
 * - Dùng RDP tỷ lệ theo đường chéo khung bao (diag * 0.052)
 * - Gộp các đỉnh thẳng hàng (góc > 152 độ)
 */
export function extractCleanCorners(pts) {
  if (!pts || pts.length < 2) return pts || []
  const b = boundingBox(pts)
  const diag = Math.hypot(b.width, b.height)
  if (diag < 0.008) return [pts[0], pts[pts.length - 1]]

  // Nếu là nét thẳng đơn thuần
  const direct = dist(pts[0], pts[pts.length - 1])
  const total = polylineLength(pts)
  if (total > 0 && direct / total >= 0.91) {
    return [pts[0], pts[pts.length - 1]]
  }

  const closed = dist(pts[0], pts[pts.length - 1]) <= diag * 0.32
  const eps = Math.max(0.008, diag * 0.052)
  let simp = ramerDouglasPeucker(pts, eps)

  // Loại bỏ đoạn râu quá ngắn ở 2 đầu nét (< 7% đường chéo)
  if (simp.length > 3 && dist(simp[0], simp[1]) < diag * 0.075) {
    simp = simp.slice(1)
  }
  if (simp.length > 3 && dist(simp[simp.length - 2], simp[simp.length - 1]) < diag * 0.075) {
    simp = simp.slice(0, -1)
  }

  // Nếu là đường khép kín, chập điểm cuối vào điểm đầu
  if (closed && simp.length >= 4) {
    simp[simp.length - 1] = { ...simp[0] }
  }

  // Gộp các đoạn thẳng gần như thẳng hàng (góc ở đỉnh > 150 độ)
  let changed = true
  while (changed && simp.length > 3) {
    changed = false
    for (let i = 1; i < simp.length - 1; i += 1) {
      const angDeg = (angleBetween(simp[i - 1], simp[i], simp[i + 1]) * 180) / Math.PI
      if (angDeg > 150) {
        simp.splice(i, 1)
        changed = true
        break
      }
    }
  }

  // Nếu khép kín, kiểm tra cả góc tại điểm nối đầu-cuối
  if (closed && simp.length >= 5) {
    const first = simp[0]
    const second = simp[1]
    const beforeLast = simp[simp.length - 2]
    const angAtStart = (angleBetween(beforeLast, first, second) * 180) / Math.PI
    if (angAtStart > 150) {
      simp.shift()
      simp[simp.length - 1] = { ...simp[0] }
    }
  }

  return simp
}

/** Kiểm tra nét thẳng */
export function isStraightLine(pts, threshold = 0.80) {
  if (!pts || pts.length < 2) return false
  const direct = dist(pts[0], pts[pts.length - 1])
  const total = polylineLength(pts)
  if (total < 0.015) return false
  if (direct / total >= threshold) return true
  // Kiểm tra RDP: nếu đường nét uốn nhẹ nhưng hướng đi thẳng từ đầu đến cuối
  const rdp = ramerDouglasPeucker(pts, 0.035)
  return rdp.length <= 3 && direct / total >= 0.72
}

/** Kiểm tra nét khép kín */
export function isClosedLoop(pts, threshold = 0.34) {
  if (!pts || pts.length < 5) return false
  const startEnd = dist(pts[0], pts[pts.length - 1])
  const bbox = boundingBox(pts)
  const diag = Math.hypot(bbox.width, bbox.height)
  const total = polylineLength(pts)
  return startEnd / Math.max(1e-4, diag) <= threshold && total >= diag * 1.7
}

/**
 * Kiểm tra Đường tròn / Elip bằng độ tròn Isoperimetric (4*pi*Area / Perimeter^2)
 * và phương sai bán kính chuẩn hóa. Phân biệt cực chuẩn với hình vuông/tam giác!
 */
export function checkCircleOrEllipse(pts) {
  if (!isClosedLoop(pts, 0.35)) return null
  const bbox = boundingBox(pts)
  const cx = bbox.cx
  const cy = bbox.cy
  const rx = bbox.width / 2
  const ry = bbox.height / 2
  if (rx < 0.02 || ry < 0.02) return null

  // Kiểm tra phương sai khoảng cách chuẩn hóa theo elip: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 = 1
  let normErr = 0
  for (const p of pts) {
    const u = (p.nx - cx) / rx
    const v = (p.ny - cy) / ry
    const rNorm = Math.hypot(u, v)
    normErr += Math.abs(rNorm - 1)
  }
  normErr /= pts.length

  // Kiểm tra xem có góc nhọn sắc cạnh nào không (nếu có >= 3 góc < 125 độ thì là đa giác chứ không phải đường tròn)
  const corners = extractCleanCorners(pts)
  const uniqueCorners = corners.slice(0, -1)
  let sharpAngles = 0
  if (uniqueCorners.length >= 3 && uniqueCorners.length <= 5) {
    const m = uniqueCorners.length
    for (let i = 0; i < m; i += 1) {
      const prev = uniqueCorners[(i - 1 + m) % m]
      const curr = uniqueCorners[i]
      const next = uniqueCorners[(i + 1) % m]
      const deg = (angleBetween(prev, curr, next) * 180) / Math.PI
      if (deg < 122) sharpAngles += 1
    }
  }

  // Nếu có 3 hoặc 4 góc nhọn rõ rệt và normErr không quá nhỏ -> ưu tiên đa giác (tam giác/tứ giác)
  if ((sharpAngles === 3 || sharpAngles === 4) && normErr > 0.11) {
    return null
  }

  if (normErr < 0.19) {
    const isCircle = Math.abs(rx - ry) / Math.max(rx, ry) < 0.24
    const meanR = (rx + ry) / 2
    return {
      type: isCircle ? 'circle' : 'ellipse',
      cx,
      cy,
      r: meanR,
      rx,
      ry,
      bbox,
      confidence: Math.max(0.82, 1 - normErr),
    }
  }
  return null
}

/**
 * Phân loại chi tiết Tam giác từ 3 đỉnh (Tam giác vuông, Tam giác cân, Tam giác đều, Tam giác thường)
 */
function classifyTriangleVertices(verts, bbox) {
  const [v0, v1, v2] = verts
  // Bảo toàn 100% tọa độ 3 đỉnh thực tế do chính người dùng vẽ ra
  const sortedByY = [...verts].sort((a, b) => a.ny - b.ny)
  const top = sortedByY[0]
  const bot = sortedByY.slice(1).sort((a, b) => a.nx - b.nx)
  const A = { nx: top.nx, ny: top.ny }
  const B = { nx: bot[0].nx, ny: bot[0].ny }
  const C = { nx: bot[1].nx, ny: bot[1].ny }

  const angA = (angleBetween(B, A, C) * 180) / Math.PI
  const angB = (angleBetween(A, B, C) * 180) / Math.PI
  const angC = (angleBetween(A, C, B) * 180) / Math.PI

  let subType = 'scalene'
  let rightVertexId = null

  // Chỉ nhận diện góc vuông khi người dùng thực sự vẽ góc xấp xỉ 90 độ (±6 độ)
  if (Math.abs(angB - 90) <= 6) {
    subType = 'right'
    rightVertexId = 'B'
  } else if (Math.abs(angC - 90) <= 6) {
    subType = 'right'
    rightVertexId = 'C'
  } else if (Math.abs(angA - 90) <= 6) {
    subType = 'right'
    rightVertexId = 'A'
  }

  // Tinh chỉnh nhẹ: Chỉ làm phẳng cạnh đáy BC nếu góc nghiêng rất nhỏ (< 4 độ)
  const dyBC = Math.abs(B.ny - C.ny)
  const dxBC = Math.abs(B.nx - C.nx)
  if (dxBC > 0.04 && dyBC / dxBC < 0.07) {
    const midY = (B.ny + C.ny) / 2
    B.ny = midY
    C.ny = midY
  }

  return {
    type: 'triangle',
    subType,
    rightVertexId,
    vertices: [A, B, C],
    bbox: bbox || boundingBox([A, B, C]),
    confidence: 0.94,
  }
}

/**
 * Phân loại chi tiết Tứ giác từ 4 đỉnh:
 * - Hình vuông (square)
 * - Hình chữ nhật (rectangle)
 * - Hình thoi (rhombus)
 * - Hình bình hành (parallelogram)
 * - Hình thang vuông / Hình thang cân / Hình thang (trapezoid)
 * - Tứ giác bất kỳ (quadrilateral)
 */
function classifyQuadVertices(verts, bboxIn) {
  const b = bboxIn || boundingBox(verts)
  // Sắp xếp 4 đỉnh theo chiều kim đồng hồ bắt đầu từ góc trên-trái (A -> B -> C -> D)
  const cx = b.cx
  const cy = b.cy
  const ordered = [...verts].sort(
    (p1, p2) => Math.atan2(p1.ny - cy, p1.nx - cx) - Math.atan2(p2.ny - cy, p2.nx - cx),
  )
  // Đảm bảo đỉnh 0 là đỉnh trên-trái (nx + ny nhỏ nhất)
  let startIdx = 0
  let bestScore = Infinity
  ordered.forEach((p, idx) => {
    const sc = p.nx + p.ny * 1.2
    if (sc < bestScore) {
      bestScore = sc
      startIdx = idx
    }
  })
  const v = [
    { ...ordered[startIdx] },
    { ...ordered[(startIdx + 1) % 4] },
    { ...ordered[(startIdx + 2) % 4] },
    { ...ordered[(startIdx + 3) % 4] },
  ]

  const [A, B, C, D] = v
  const topBottomParallel = areParallel(A, B, D, C, 18)
  const leftRightParallel = areParallel(A, D, B, C, 18)

  let rightAngles = 0
  for (let i = 0; i < 4; i += 1) {
    const prev = v[(i + 3) % 4]
    const curr = v[i]
    const next = v[(i + 1) % 4]
    const deg = (angleBetween(prev, curr, next) * 180) / Math.PI
    if (Math.abs(deg - 90) <= 18) rightAngles += 1
  }

  const sAB = dist(A, B)
  const sBC = dist(B, C)
  const sCD = dist(C, D)
  const sDA = dist(D, A)
  const meanSide = (sAB + sBC + sCD + sDA) / 4
  const allSidesEqual =
    Math.abs(sAB - meanSide) / meanSide < 0.12 &&
    Math.abs(sBC - meanSide) / meanSide < 0.12 &&
    Math.abs(sCD - meanSide) / meanSide < 0.12 &&
    Math.abs(sDA - meanSide) / meanSide < 0.12

  // 1. Tinh chỉnh nhẹ các cạnh gần nằm ngang (< 6 độ) trên chính đỉnh của người dùng
  const dxAB = Math.abs(A.nx - B.nx)
  const dyAB = Math.abs(A.ny - B.ny)
  if (dxAB > 0.04 && dyAB / dxAB < 0.10) {
    const midY = (A.ny + B.ny) / 2
    A.ny = midY
    B.ny = midY
  }
  const dxCD = Math.abs(D.nx - C.nx)
  const dyCD = Math.abs(D.ny - C.ny)
  if (dxCD > 0.04 && dyCD / dxCD < 0.10) {
    const midY = (D.ny + C.ny) / 2
    D.ny = midY
    C.ny = midY
  }
  // Tinh chỉnh nhẹ các cạnh gần thẳng đứng (< 6 độ) trên chính đỉnh của người dùng
  const dyAD = Math.abs(A.ny - D.ny)
  const dxAD = Math.abs(A.nx - D.nx)
  if (dyAD > 0.04 && dxAD / dyAD < 0.10) {
    const midX = (A.nx + D.nx) / 2
    A.nx = midX
    D.nx = midX
  }
  const dyBC = Math.abs(B.ny - C.ny)
  const dxBC = Math.abs(B.nx - C.nx)
  if (dyBC > 0.04 && dxBC / dyBC < 0.10) {
    const midX = (B.nx + C.nx) / 2
    B.nx = midX
    C.nx = midX
  }

  const isRectangular = rightAngles >= 3 || (topBottomParallel && leftRightParallel && rightAngles >= 2)
  const sideRatio = Math.min(sAB, sBC) / Math.max(1e-4, Math.max(sAB, sBC))
  const isSquare = isRectangular && allSidesEqual && sideRatio >= 0.92

  let type = 'quadrilateral'
  let subType = 'general_quad'

  if (isSquare) {
    type = 'square'
    subType = 'square'
  } else if (isRectangular) {
    type = 'rectangle'
    subType = 'rectangle'
  } else if (allSidesEqual && (topBottomParallel || leftRightParallel)) {
    type = 'rhombus'
    subType = 'rhombus'
  } else if (topBottomParallel && leftRightParallel) {
    type = 'parallelogram'
    subType = 'parallelogram'
  } else if (topBottomParallel || leftRightParallel) {
    type = 'trapezoid'
    subType = 'trapezoid'
  }

  return {
    type,
    subType,
    vertices: [A, B, C, D], // BẢO TOÀN 4 ĐỈNH NẮN CHỈNH TỪ NÉT VẼ CỦA NGƯỜI DÙNG
    bbox: boundingBox([A, B, C, D]),
    confidence: 0.94,
  }
}

/** Kiểm tra tam giác từ 1 nét vẽ */
export function checkTriangle(pts) {
  if (!isClosedLoop(pts, 0.38)) return null
  const corners = extractCleanCorners(pts)
  const unique = corners.slice(0, -1)
  if (unique.length === 3) {
    return classifyTriangleVertices(unique, boundingBox(pts))
  }
  return null
}

/** Kiểm tra tứ giác (vuông, chữ nhật, bình hành, hình thang, hình thoi) từ 1 nét vẽ */
export function checkRectangle(pts) {
  if (!isClosedLoop(pts, 0.38)) return null
  const corners = extractCleanCorners(pts)
  const unique = corners.slice(0, -1)
  if (unique.length === 4) {
    return classifyQuadVertices(unique, boundingBox(pts))
  }
  return null
}

/**
 * Nhận diện chữ viết tay công thức / hàm số (ví dụ: y = x^2 - 3, y = A sin x + B)
 */
export function checkEquationHandwriting(strokes) {
  if (!strokes || strokes.length < 4) return null
  const allPts = []
  let smallStrokesCount = 0
  let largeClosedLoops = 0

  for (const s of strokes) {
    const pts = s.points || []
    allPts.push(...pts)
    const sb = boundingBox(pts)
    if (sb.width < 0.09 && sb.height < 0.12) {
      smallStrokesCount += 1
    }
    if (sb.width > 0.08 && sb.height > 0.08 && isClosedLoop(pts, 0.32)) {
      largeClosedLoops += 1
    }
  }

  const totalBbox = boundingBox(allPts)
  if (largeClosedLoops === 0 && smallStrokesCount >= strokes.length * 0.65 && totalBbox.width > 0.08) {
    return {
      type: 'equation',
      bbox: totalBbox,
      confidence: 0.94,
    }
  }
  return null
}

/**
 * Xây dựng Đồ thị Đỉnh - Cạnh (Topological Graph V, E) từ tập hợp các nét vẽ của giáo viên!
 * Đây là trái tim của quy tắc vẽ hình tự do:
 * - Tự động gom các nét đứt vẽ tay (nhiều đoạn ngắn thẳng hàng - - -) thành 1 cạnh nét đứt (dashed: true)
 * - Bỏ qua các ký hiệu góc vuông nhỏ để không sinh đỉnh rác
 * - Bắt dính chữ T (T-junction): Chân đường cao H, trung điểm M nằm trên cạnh BC được hít thẳng lên cạnh BC!
 */
export function buildTopologicalGraph(strokes) {
  const allPts = []
  strokes.forEach((s) => allPts.push(...(s.points || [])))
  const bbox = boundingBox(allPts)
  const diag = Math.hypot(bbox.width, bbox.height)
  const snapTol = Math.max(0.022, diag * 0.075)

  const shortDashCandidates = []
  const rawSegments = []

  for (const s of strokes) {
    const pts = s.points || []
    if (pts.length < 2) continue
    const sb = boundingBox(pts)
    const sDiag = Math.hypot(sb.width, sb.height)

    // Nếu là nét ký hiệu góc vuông rất nhỏ hoặc chấm điểm (nhỏ hơn 12% kích thước hình) -> không biến thành cạnh rác
    if (strokes.length > 2 && sDiag < diag * 0.12 && sDiag < 0.04) {
      continue
    }

    // Nếu là đoạn thẳng ngắn (< 26% kích thước hình) -> đưa vào nhóm ứng viên nét đứt vẽ tay (- - -)
    if (strokes.length >= 4 && sDiag >= diag * 0.04 && sDiag < diag * 0.26 && isStraightLine(pts, 0.85)) {
      shortDashCandidates.push({
        p0: pts[0],
        p1: pts[pts.length - 1],
        used: false,
      })
      continue
    }

    const corners = extractCleanCorners(pts)
    for (let i = 1; i < corners.length; i += 1) {
      if (dist(corners[i - 1], corners[i]) >= diag * 0.05) {
        rawSegments.push({
          p0: corners[i - 1],
          p1: corners[i],
          dashed: Boolean(s.dashed),
        })
      }
    }
  }

  // Gom các đoạn ngắn thẳng hàng (- - -) thành 1 cạnh nét đứt hoàn chỉnh
  for (let i = 0; i < shortDashCandidates.length; i += 1) {
    if (shortDashCandidates[i].used) continue
    const chain = [shortDashCandidates[i]]
    shortDashCandidates[i].used = true

    for (let j = i + 1; j < shortDashCandidates.length; j += 1) {
      if (shortDashCandidates[j].used) continue
      const cand = shortDashCandidates[j]
      if (areParallel(chain[0].p0, chain[0].p1, cand.p0, cand.p1, 18)) {
        const dLine = distToSegment(cand.p0, chain[0].p0, chain[0].p1)
        const minEndpointDist = Math.min(
          dist(chain[chain.length - 1].p1, cand.p0),
          dist(chain[chain.length - 1].p0, cand.p1),
          dist(chain[0].p0, cand.p1),
          dist(chain[0].p1, cand.p0),
        )
        if (dLine < diag * 0.12 && minEndpointDist < diag * 0.22) {
          chain.push(cand)
          cand.used = true
        }
      }
    }

    if (chain.length >= 2) {
      // Tìm 2 đầu mút xa nhau nhất trong chuỗi nét đứt
      const chainPts = chain.flatMap((c) => [c.p0, c.p1])
      let maxD = -1
      let bestPair = [chainPts[0], chainPts[1]]
      for (let a = 0; a < chainPts.length; a += 1) {
        for (let b = a + 1; b < chainPts.length; b += 1) {
          const d = dist(chainPts[a], chainPts[b])
          if (d > maxD) {
            maxD = d
            bestPair = [chainPts[a], chainPts[b]]
          }
        }
      }
      rawSegments.push({
        p0: bestPair[0],
        p1: bestPair[1],
        dashed: true,
      })
    } else {
      rawSegments.push({
        p0: chain[0].p0,
        p1: chain[0].p1,
        dashed: false,
      })
    }
  }

  const vertices = [] // { idx, nx, ny, count, degree }
  function findOrCreateVertex(pt) {
    for (const v of vertices) {
      if (dist(v, pt) <= snapTol) {
        v.nx = (v.nx * v.count + pt.nx) / (v.count + 1)
        v.ny = (v.ny * v.count + pt.ny) / (v.count + 1)
        v.count += 1
        return v
      }
    }
    const nv = {
      idx: vertices.length,
      nx: pt.nx,
      ny: pt.ny,
      count: 1,
      degree: 0,
    }
    vertices.push(nv)
    return nv
  }

  const edges = [] // { u, v, dashed }
  for (const seg of rawSegments) {
    const u = findOrCreateVertex(seg.p0)
    const v = findOrCreateVertex(seg.p1)
    if (u.idx !== v.idx) {
      const exists = edges.some(
        (e) => (e.u === u.idx && e.v === v.idx) || (e.u === v.idx && e.v === u.idx),
      )
      if (!exists) {
        edges.push({ u: u.idx, v: v.idx, dashed: seg.dashed })
        u.degree += 1
        v.degree += 1
      }
    }
  }

  // Bắt dính chữ T (T-junction): Nếu 1 đỉnh H (ví dụ chân đường cao AH, trung điểm M) nằm sát phần trong của cạnh UV,
  // tự động chiếu H lên đúng đoạn thẳng UV!
  for (const w of vertices) {
    for (const e of edges) {
      if (w.idx === e.u || w.idx === e.v) continue
      const u = vertices[e.u]
      const v = vertices[e.v]
      if (!u || !v) continue
      const dx = v.nx - u.nx
      const dy = v.ny - u.ny
      const len2 = dx * dx + dy * dy
      if (len2 < 1e-6) continue
      const t = ((w.nx - u.nx) * dx + (w.ny - u.ny) * dy) / len2
      if (t >= 0.1 && t <= 0.9) {
        const projX = u.nx + t * dx
        const projY = u.ny + t * dy
        if (Math.hypot(w.nx - projX, w.ny - projY) <= snapTol * 0.85) {
          w.nx = projX
          w.ny = projY
          w.onEdge = [u.idx, v.idx]
          w.along = Math.abs(t - 0.5) < 0.08 ? 0.5 : t
        }
      }
    }
  }

  return { vertices, edges, bbox, diag }
}

/**
 * Nhận diện Khối lăng trụ vát / Lăng trụ đứng đáy hình thang vuông (như khối nhà, khối hộp cắt vát mái dốc)
 */
export function check3dTruncatedPrism(strokes) {
  if (!strokes || strokes.length < 2) return null
  if (checkEquationHandwriting(strokes)) return null

  const graph = buildTopologicalGraph(strokes)
  const { vertices, edges, bbox } = graph
  if (bbox.width < 0.05 || bbox.height < 0.05) return null

  // Khối lăng trụ vát / đáy hình thang / khối nhà mái dốc: thường có 6 đến 22 đỉnh, >= 6 cạnh
  if (vertices.length < 6 || vertices.length > 22) return null
  if (edges.length < 6) return null

  // Tìm các đoạn thẳng đứng (vertical segments)
  const vEdges = []
  edges.forEach((e) => {
    const v1 = vertices[e.u]
    const v2 = vertices[e.v]
    const dx = Math.abs(v1.nx - v2.nx)
    const dy = Math.abs(v1.ny - v2.ny)
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI
    if (deg >= 55 && dy >= bbox.height * 0.14) {
      vEdges.push({
        v1,
        v2,
        height: dy,
        minY: Math.min(v1.ny, v2.ny),
        maxY: Math.max(v1.ny, v2.ny),
        cx: (v1.nx + v2.nx) / 2,
      })
    }
  })

  let hasSlantedTop = false
  let isUnequalHeights = false
  let isLeftTaller = true

  // Tìm các cạnh nghiêng ở phần trên (mái dốc / cạnh cắt vát)
  edges.forEach((e) => {
    const v1 = vertices[e.u]
    const v2 = vertices[e.v]
    const dx = Math.abs(v1.nx - v2.nx)
    const dy = Math.abs(v1.ny - v2.ny)
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI
    const avgY = (v1.ny + v2.ny) / 2
    if (avgY <= bbox.minY + bbox.height * 0.75 && deg >= 10 && deg <= 75 && dx >= bbox.width * 0.14) {
      hasSlantedTop = true
    }
  })

  if (vEdges.length >= 2) {
    vEdges.sort((a, b) => a.cx - b.cx)
    const leftEdge = vEdges[0]
    const rightEdge = vEdges[vEdges.length - 1]
    const maxH = Math.max(leftEdge.height, rightEdge.height)
    const minH = Math.min(leftEdge.height, rightEdge.height)
    if (maxH / Math.max(1e-4, minH) >= 1.15) {
      isUnequalHeights = true
      isLeftTaller = leftEdge.height > rightEdge.height
    }
  }

  // Hoặc kiểm tra các đỉnh trên cùng xem có độ dốc chênh lệch
  const topVertices = vertices.filter((v) => v.ny <= bbox.minY + bbox.height * 0.45)
  if (topVertices.length >= 2) {
    const leftTop = topVertices.filter((v) => v.nx < bbox.minX + bbox.width * 0.5)
    const rightTop = topVertices.filter((v) => v.nx >= bbox.minX + bbox.width * 0.5)
    if (leftTop.length && rightTop.length) {
      const minLeftY = Math.min(...leftTop.map((v) => v.ny))
      const minRightY = Math.min(...rightTop.map((v) => v.ny))
      if (Math.abs(minLeftY - minRightY) >= bbox.height * 0.08) {
        hasSlantedTop = true
        isLeftTaller = minLeftY < minRightY
      }
    }
  }

  if (isUnequalHeights || hasSlantedTop) {
    const aspect = bbox.width / Math.max(1e-4, bbox.height)
    return {
      type: 'trapezoid_prism',
      subType: 'truncated_prism',
      bbox,
      confidence: 0.96,
      aspect,
      isLeftTaller,
      graph,
    }
  }

  return null
}

/**
 * Nhận diện Hình lăng trụ đứng tam giác ABC.A'B'C' (6 đỉnh, 2 đáy tam giác, 3 cạnh bên đứng)
 */
export function check3dPrism(strokes) {
  if (!strokes || strokes.length < 2) return null
  if (checkEquationHandwriting(strokes)) return null

  const graph = buildTopologicalGraph(strokes)
  const { vertices, edges, bbox } = graph
  if (bbox.width < 0.07 || bbox.height < 0.07) return null

  // Hình lăng trụ đứng tam giác có đúng 6 đỉnh (hoặc 5-7 do nét vẽ tay), 7-11 cạnh
  if (vertices.length >= 5 && vertices.length <= 7 && edges.length >= 7 && edges.length <= 12) {
    let vCount = 0
    edges.forEach((e) => {
      const v1 = vertices[e.u]
      const v2 = vertices[e.v]
      const dx = Math.abs(v1.nx - v2.nx)
      const dy = Math.abs(v1.ny - v2.ny)
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI
      if (deg >= 65 && dy >= bbox.height * 0.22) vCount += 1
    })

    if (vCount >= 2 && vCount <= 4) {
      const aspect = bbox.width / Math.max(1e-4, bbox.height)
      return {
        type: 'prism_3d',
        subType: 'triangular_prism',
        bbox,
        confidence: 0.95,
        aspect,
        graph,
      }
    }
  }

  return null
}

/**
 * Nhận diện hình lập phương / hình hộp 3D
 */
export function check3dCube(strokes) {
  if (!strokes || strokes.length < 2) return null
  if (checkEquationHandwriting(strokes)) return null

  const allPts = []
  let slantSegments = 0
  let horizontalSegments = 0
  let verticalSegments = 0
  let hasLargeRect = false

  for (const s of strokes) {
    const pts = s.points || []
    allPts.push(...pts)
    const sb = boundingBox(pts)
    if (sb.width >= 0.06 && sb.height >= 0.06 && isClosedLoop(pts, 0.38)) {
      const corners = extractCleanCorners(pts)
      if (corners.length - 1 === 4) hasLargeRect = true
    }

    const simp = extractCleanCorners(pts)
    for (let i = 1; i < simp.length; i += 1) {
      const p0 = simp[i - 1]
      const p1 = simp[i]
      if (dist(p0, p1) < 0.025) continue
      const deg = segmentAngleDeg180(p0, p1)
      if (deg < 20 || deg > 160) horizontalSegments += 1
      else if (Math.abs(deg - 90) < 20) verticalSegments += 1
      else if ((deg >= 20 && deg <= 68) || (deg >= 112 && deg <= 160)) slantSegments += 1
    }
  }

  const bbox = boundingBox(allPts)
  if (bbox.width < 0.07 || bbox.height < 0.07) return null
  const aspect = bbox.width / Math.max(1e-4, bbox.height)
  if (aspect < 0.45 || aspect > 2.5) return null

  // Phân biệt rõ hình hộp chữ nhật (rectangular_prism) và hình lập phương (cube):
  // Chỉ coi là hình lập phương khi tỉ lệ khung bao gần như 1.0 (từ 0.90 đến 1.10)
  const isCube = aspect >= 0.90 && aspect <= 1.10
  const subType = isCube ? 'cube' : 'rectangular_prism'

  // 1 mặt chữ nhật/vuông trước + ít nhất 2 đoạn xiên/nối chiều sâu
  const graph = buildTopologicalGraph(strokes)
  if (hasLargeRect && strokes.length >= 2 && slantSegments >= 1 && (horizontalSegments + verticalSegments >= 4)) {
    return {
      type: 'cube_3d',
      bbox,
      confidence: 0.95,
      subType,
      aspect,
      graph,
    }
  }

  // Hoặc đồ thị có từ 7-10 đỉnh và >= 8 cạnh (gồm đủ ngang, dọc, xiên)
  if (
    graph.vertices.length >= 7 &&
    graph.vertices.length <= 10 &&
    graph.edges.length >= 8 &&
    horizontalSegments >= 3 &&
    verticalSegments >= 3 &&
    slantSegments >= 2
  ) {
    return {
      type: 'cube_3d',
      bbox,
      confidence: 0.93,
      subType,
      aspect,
      graph,
    }
  }

  return null
}

/**
 * Nhận diện Hình chóp 3D (Tứ diện S.ABC, Chóp S.ABCD có SA ⊥ đáy, Chóp tứ giác đều S.ABCD)
 */
export function check3dPyramid(strokes) {
  if (!strokes || strokes.length < 2) return null
  if (checkEquationHandwriting(strokes)) return null

  const graph = buildTopologicalGraph(strokes)
  const { vertices, edges, bbox } = graph
  if (bbox.width < 0.07 || bbox.height < 0.07) return null

  // Tìm đỉnh S cao nhất (ny nhỏ nhất) có bậc >= 3 (nối xuống ít nhất 3 đỉnh đáy)
  const sortedByY = [...vertices].sort((a, b) => a.ny - b.ny)
  const topV = sortedByY[0]
  if (!topV || topV.degree < 3) return null
  if (topV.ny > bbox.minY + bbox.height * 0.25) return null

  // Các đỉnh đáy ở phía dưới
  const baseVerts = vertices.filter((v) => v.idx !== topV.idx && v.ny > topV.ny + bbox.height * 0.25)
  if (baseVerts.length === 3 && edges.length >= 5) {
    return {
      type: 'tetrahedron_3d',
      bbox,
      confidence: 0.92,
      graph,
    }
  }

  if (baseVerts.length >= 4 && edges.length >= 6) {
    // Kiểm tra xem cạnh bên trái nhất nối từ S xuống đáy có thẳng đứng không (SA ⊥ (ABCD))
    const leftBase = [...baseVerts].sort((a, b) => a.nx - b.nx)[0]
    const isSaVertical = Math.abs(topV.nx - leftBase.nx) < bbox.width * 0.14
    return {
      type: isSaVertical ? 'pyramid_sa_perp_3d' : 'pyramid_3d',
      bbox,
      confidence: 0.91,
      graph,
    }
  }

  return null
}

/** Nhận diện Hình trụ / Hình nón 3D */
export function check3dCylinder(strokes) {
  if (!strokes || strokes.length < 2) return null
  const allPts = []
  strokes.forEach((s) => allPts.push(...(s.points || [])))
  const bbox = boundingBox(allPts)

  let ellipses = 0
  let verticals = 0
  let slants = 0
  for (const s of strokes) {
    const pts = s.points || []
    if (checkCircleOrEllipse(pts)) ellipses += 1
    else if (isStraightLine(pts)) {
      const deg = segmentAngleDeg180(pts[0], pts[pts.length - 1])
      if (Math.abs(deg - 90) < 20) verticals += 1
      else if (deg > 35 && deg < 145) slants += 1
    }
  }

  if (ellipses >= 1 && verticals >= 2) {
    return { type: 'cylinder_3d', bbox, confidence: 0.88 }
  }
  if (ellipses >= 1 && slants >= 2) {
    return { type: 'cone_3d', bbox, confidence: 0.88 }
  }
  return null
}

/**
 * Phân tích tổng thể nhóm nét vẽ (Selection hoặc Recent strokes)
 * Hỗ trợ cả 1 nét khép kín, nhiều nét ghép thành đa giác, hình tròn ngoại tiếp, và đồ thị hình học tự do!
 */
export function recognizeStrokes(strokes) {
  if (!strokes || !strokes.length) return null

  // 0. Kiểm tra chữ viết tay công thức / hàm số
  const eq = checkEquationHandwriting(strokes)
  if (eq) return eq

  // 1. Nếu là 1 nét duy nhất:
  if (strokes.length === 1) {
    const pts = strokes[0].points || []
    if (pts.length < 2) return null

    if (isStraightLine(pts)) {
      let p0 = { ...pts[0] }
      let p1 = { ...pts[pts.length - 1] }
      const dx = Math.abs(p1.nx - p0.nx)
      const dy = Math.abs(p1.ny - p0.ny)

      // Snap chuẩn ngang tuyệt đối nếu góc nghiêng nhỏ hơn ~16 độ (không bị lệch)
      if (dx > 0.02 && dy / dx < 0.28) {
        const midY = (p0.ny + p1.ny) / 2
        p0.ny = midY
        p1.ny = midY
      }
      // Snap chuẩn dọc tuyệt đối nếu độ lệch ngang nhỏ hơn ~16 độ (không bị lệch)
      else if (dy > 0.02 && dx / dy < 0.28) {
        const midX = (p0.nx + p1.nx) / 2
        p0.nx = midX
        p1.nx = midX
      }

      return {
        type: 'line',
        p0,
        p1,
        bbox: boundingBox([p0, p1]),
        confidence: 0.95,
      }
    }

    // Kiểm tra Đường tròn / Elip trước
    const circle = checkCircleOrEllipse(pts)
    if (circle) return circle

    // Kiểm tra Đa giác khép kín 1 nét (Tam giác, Tứ giác, Ngũ giác, Lục giác)
    if (isClosedLoop(pts, 0.38)) {
      const corners = extractCleanCorners(pts)
      const unique = corners.slice(0, -1)
      if (unique.length === 3) {
        return classifyTriangleVertices(unique, boundingBox(pts))
      }
      if (unique.length === 4) {
        return classifyQuadVertices(unique, boundingBox(pts))
      }
      if (unique.length === 5 || unique.length === 6) {
        return {
          type: unique.length === 5 ? 'pentagon' : 'hexagon',
          vertices: unique,
          bbox: boundingBox(pts),
          confidence: 0.88,
        }
      }
    }
  }

  // 2. Kiểm tra Đường tròn kết hợp Đa giác / Dây cung (ví dụ Đường tròn ngoại tiếp tam giác ABC)
  const circleStrokeIdx = strokes.findIndex((s) => checkCircleOrEllipse(s.points || []))
  if (circleStrokeIdx >= 0 && strokes.length >= 2) {
    const cRes = checkCircleOrEllipse(strokes[circleStrokeIdx].points)
    const otherStrokes = strokes.filter((_, idx) => idx !== circleStrokeIdx)
    const subGraph = buildTopologicalGraph(otherStrokes)
    if (cRes && subGraph.edges.length >= 1) {
      return {
        type: 'circle_with_lines',
        circle: cRes,
        graph: subGraph,
        bbox: boundingBox([
          ...(strokes[circleStrokeIdx].points || []),
          ...otherStrokes.flatMap((s) => s.points || []),
        ]),
        confidence: 0.92,
      }
    }
  }

  // 3. Kiểm tra mô hình không gian 3D (Lăng trụ vát, Lăng trụ tam giác, Hình hộp/Lập phương, Chóp, Trụ, Nón)
  const truncatedPrism = check3dTruncatedPrism(strokes)
  if (truncatedPrism) return truncatedPrism

  const prism = check3dPrism(strokes)
  if (prism) return prism

  const cube = check3dCube(strokes)
  if (cube) return cube

  const pyramid = check3dPyramid(strokes)
  if (pyramid) return pyramid

  const cylinder = check3dCylinder(strokes)
  if (cylinder) return cylinder

  // 4. Phân tích bằng Đồ thị Đỉnh - Cạnh (Topological Graph) cho hình vẽ nhiều nét!
  // Dù giáo viên vẽ tam giác bằng 2 hay 3 nét, hoặc vẽ hình thang/bình hành bằng 2, 3, 4 nét đều nhận diện chính xác!
  const graph = buildTopologicalGraph(strokes)
  const { vertices, edges, bbox } = graph

  // Chu trình 3 đỉnh, 3 cạnh -> Tam giác (vuông, cân, đều, thường)
  if (vertices.length === 3 && edges.length === 3) {
    return classifyTriangleVertices(vertices, bbox)
  }

  // Chu trình 4 đỉnh, 4 cạnh (mỗi đỉnh bậc 2) -> Tứ giác (vuông, chữ nhật, thoi, bình hành, hình thang)
  if (vertices.length === 4 && edges.length === 4 && vertices.every((v) => v.degree === 2)) {
    return classifyQuadVertices(vertices, bbox)
  }

  // 5. Nếu giáo viên vẽ một HÌNH BÀI TẬP PHỨC TẠP (ví dụ: Tam giác ABC có sẵn đường cao AH,
  // hoặc Tứ giác nối 2 đường chéo, hoặc Hình không gian tự dựng):
  // Giữ nguyên đồ thị Đỉnh - Cạnh (custom_graph), tự nắn thẳng tất cả các cạnh và bắt góc vuông!
  if (vertices.length >= 3 && edges.length >= 2) {
    return {
      type: 'custom_graph',
      graph,
      bbox,
      confidence: 0.88,
    }
  }

  return {
    type: 'general',
    bbox,
    confidence: 0.5,
  }
}

/**
 * Sinh danh sách các nét vẽ đã hoàn thiện (Beautified Vector Strokes)
 */
export function generateBeautifiedStrokes(result, color = '#f8fafc', width = 2.5, style = 'solid', opacity = 1) {
  if (!result) return []
  const strokes = []
  const strokeId = (suffix) => `beautified_${Date.now()}_${suffix}`
  const b = result.bbox || { minX: 0.25, maxX: 0.65, minY: 0.25, maxY: 0.65, width: 0.4, height: 0.4, cx: 0.45, cy: 0.45 }

  if (result.type === 'line') {
    strokes.push({
      id: strokeId('line'),
      color,
      width,
      style,
      dashed: style === 'dashed',
      opacity,
      points: [result.p0, result.p1],
    })
  } else if (result.type === 'circle' || result.type === 'ellipse') {
    const pts = []
    const count = 56
    const rx = result.type === 'circle' ? result.r : result.rx
    const ry = result.type === 'circle' ? result.r : result.ry
    for (let i = 0; i <= count; i += 1) {
      const angle = (i / count) * 2 * Math.PI
      pts.push({
        nx: result.cx + Math.cos(angle) * rx,
        ny: result.cy + Math.sin(angle) * ry,
      })
    }
    strokes.push({
      id: strokeId('circle'),
      color,
      width,
      style,
      dashed: style === 'dashed',
      opacity,
      points: pts,
    })
  } else if (result.vertices && result.vertices.length >= 3) {
    const v = result.vertices
    strokes.push({
      id: strokeId('poly'),
      color,
      width,
      style,
      dashed: style === 'dashed',
      opacity,
      points: [...v, v[0]],
    })
  } else if (result.graph && result.graph.vertices && result.graph.vertices.length >= 2) {
    const { vertices, edges } = result.graph
    edges.forEach((e, idx) => {
      const edgeStyle = e.dashed ? 'dashed' : style
      strokes.push({
        id: strokeId(`edge_${idx}`),
        color,
        width,
        style: edgeStyle,
        dashed: Boolean(e.dashed || style === 'dashed'),
        opacity,
        points: [
          { nx: vertices[e.u].nx, ny: vertices[e.u].ny },
          { nx: vertices[e.v].nx, ny: vertices[e.v].ny },
        ],
      })
    })
  }

  return strokes
}

/**
 * Tên hiển thị tiếng Việt cho thông báo
 */
export function getShapeLabel(type, subType) {
  if (type === 'triangle') {
    if (subType === 'right') return 'Tam giác vuông'
    if (subType === 'isosceles') return 'Tam giác cân'
    if (subType === 'equilateral') return 'Tam giác đều'
    return 'Tam giác ABC'
  }
  switch (type) {
    case 'trapezoid_prism':
      return 'Khối lăng trụ vát / đáy hình thang'
    case 'cube_3d':
      return subType === 'rectangular_prism'
        ? "Hình hộp chữ nhật ABCD.A'B'C'D'"
        : "Hình lập phương ABCD.A'B'C'D'"
    case 'tetrahedron_3d':
      return 'Tứ diện / Chóp tam giác S.ABC'
    case 'pyramid_sa_perp_3d':
      return 'Hình chóp S.ABCD (SA ⊥ đáy)'
    case 'pyramid_3d':
      return 'Hình chóp tứ giác S.ABCD'
    case 'prism_3d':
    case 'triangular_prism':
      return "Hình lăng trụ đứng tam giác ABC.A'B'C'"
    case 'cylinder_3d':
      return 'Hình trụ 3D'
    case 'cone_3d':
      return 'Hình nón 3D'
    case 'circle':
      return 'Đường tròn tâm O'
    case 'circle_with_lines':
      return 'Đường tròn & Dây cung / Nội tiếp'
    case 'ellipse':
      return 'Hình Elip'
    case 'square':
      return 'Hình vuông ABCD'
    case 'rectangle':
      return 'Hình chữ nhật ABCD'
    case 'rhombus':
      return 'Hình thoi ABCD'
    case 'parallelogram':
      return 'Hình bình hành ABCD'
    case 'trapezoid':
      return subType === 'right_trapezoid' ? 'Hình thang vuông ABCD' : 'Hình thang ABCD'
    case 'quadrilateral':
      return 'Tứ giác ABCD'
    case 'pentagon':
      return 'Ngũ giác ABCDE'
    case 'hexagon':
      return 'Lục giác ABCDEF'
    case 'custom_graph':
      return 'Hình bài tập (Đồ thị Đỉnh - Cạnh)'
    case 'line':
      return 'Đoạn thẳng AB'
    default:
      return 'Hình học'
  }
}

/**
 * Tự động phát hiện các góc vuông (90° +- 13°) tại các đỉnh VÀ tại các giao điểm chữ T
 * (ví dụ chân đường cao H nằm trên cạnh BC, hoặc đường cao SO vuông góc đáy) để gắn ký hiệu góc vuông chuẩn SGK!
 */
function detectRightAngleMarkers(vertices, segments) {
  const markers = []
  const usedVertices = new Set()
  const vMap = new Map(vertices.map((v) => [v.id, v]))

  // 1. Góc vuông tại đỉnh nối >= 2 đoạn thẳng
  vertices.forEach((v) => {
    const incident = segments.filter((s) => s.from === v.id || s.to === v.id)
    if (incident.length >= 2) {
      for (let i = 0; i < incident.length; i += 1) {
        for (let j = i + 1; j < incident.length; j += 1) {
          const n1Id = incident[i].from === v.id ? incident[i].to : incident[i].from
          const n2Id = incident[j].from === v.id ? incident[j].to : incident[j].from
          const p1 = vMap.get(n1Id)
          const p2 = vMap.get(n2Id)
          if (p1 && p2) {
            const deg = (angleBetween(p1, v, p2) * 180) / Math.PI
            if (Math.abs(deg - 90) <= 12) {
              markers.push({ id: `ra_${v.id}_${n1Id}_${n2Id}`, vertex: v.id, leg1: n1Id, leg2: n2Id })
              usedVertices.add(v.id)
              return
            }
          }
        }
      }
    }
  })

  // 2. Góc vuông chữ T (T-junction): Đỉnh H nằm trên đoạn BC và có đoạn AH vuông góc với BC
  vertices.forEach((v) => {
    if (usedVertices.has(v.id)) return
    const incident = segments.filter((s) => s.from === v.id || s.to === v.id)
    if (!incident.length) return

    for (const hostSeg of segments) {
      if (hostSeg.from === v.id || hostSeg.to === v.id) continue
      const B = vMap.get(hostSeg.from)
      const C = vMap.get(hostSeg.to)
      if (!B || !C) continue
      const dx = C.nx - B.nx
      const dy = C.ny - B.ny
      const len2 = dx * dx + dy * dy
      if (len2 < 1e-6) continue
      const t = ((v.nx - B.nx) * dx + (v.ny - B.ny) * dy) / len2
      if (t >= 0.08 && t <= 0.92) {
        const projX = B.nx + t * dx
        const projY = B.ny + t * dy
        if (Math.hypot(v.nx - projX, v.ny - projY) <= 0.032) {
          for (const inc of incident) {
            const AId = inc.from === v.id ? inc.to : inc.from
            const A = vMap.get(AId)
            if (!A) continue
            const deg = (angleBetween(A, { nx: projX, ny: projY }, C) * 180) / Math.PI
            if (Math.abs(deg - 90) <= 15) {
              // Hít chính xác chân đường cao H vuông góc xuống BC
              const tPerp = Math.max(0.08, Math.min(0.92, ((A.nx - B.nx) * dx + (A.ny - B.ny) * dy) / len2))
              v.nx = B.nx + tPerp * dx
              v.ny = B.ny + tPerp * dy
              v.edge = [hostSeg.from, hostSeg.to]
              v.along = tPerp
              v.perpFrom = AId
              markers.push({ id: `ra_${v.id}_${AId}_${hostSeg.to}`, vertex: v.id, leg1: AId, leg2: hostSeg.to })
              usedVertices.add(v.id)
              break
            }
          }
        }
      }
    }
  })

  return markers
}

/**
 * Chuyển đổi kết quả nhận diện nét vẽ thành Đối tượng Hình học tương tác (BoardGeometryShape)
 */
export function createGeometryShapeFromResult(result, color = '#f8fafc') {
  if (!result) return null
  const id = `geom_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const safeBbox =
    result.bbox ||
    (result.vertices?.length ? boundingBox(result.vertices) : null) ||
    (result.cx !== undefined
      ? {
        minX: result.cx - (result.rx || result.r || 0.15),
        maxX: result.cx + (result.rx || result.r || 0.15),
        minY: result.cy - (result.ry || result.r || 0.15),
        maxY: result.cy + (result.ry || result.r || 0.15),
        width: (result.rx || result.r || 0.15) * 2,
        height: (result.ry || result.r || 0.15) * 2,
        cx: result.cx,
        cy: result.cy,
      }
      : { minX: 0.25, maxX: 0.65, minY: 0.25, maxY: 0.65, width: 0.4, height: 0.4, cx: 0.45, cy: 0.45 })

  // 1. TAM GIÁC (Thường, Vuông, Cân, Đều)
  if (result.type === 'triangle') {
    let A, B, C
    if (result.vertices && result.vertices.length >= 3) {
      A = { id: 'A', label: 'A', nx: result.vertices[0].nx, ny: result.vertices[0].ny }
      B = { id: 'B', label: 'B', nx: result.vertices[1].nx, ny: result.vertices[1].ny }
      C = { id: 'C', label: 'C', nx: result.vertices[2].nx, ny: result.vertices[2].ny }
    } else {
      const b = safeBbox
      A = { id: 'A', label: 'A', nx: b.cx, ny: b.minY }
      B = { id: 'B', label: 'B', nx: b.minX, ny: b.maxY }
      C = { id: 'C', label: 'C', nx: b.maxX, ny: b.maxY }
    }
    const segments = [
      { id: 's_AB', from: 'A', to: 'B', dashed: false },
      { id: 's_BC', from: 'B', to: 'C', dashed: false },
      { id: 's_CA', from: 'C', to: 'A', dashed: false },
    ]
    const rightAngles = detectRightAngleMarkers([A, B, C], segments)
    return {
      id,
      type: 'triangle',
      name: getShapeLabel('triangle', result.subType),
      vertices: [A, B, C],
      segments,
      customPoints: [],
      rightAngles,
      activeTool: 'select',
      color,
      bbox: safeBbox,
    }
  }

  // 2. TỨ GIÁC (Hình vuông, Chữ nhật, Hình thoi, Hình bình hành, Hình thang, Tứ giác bất kỳ)
  if (
    result.type === 'rectangle' ||
    result.type === 'square' ||
    result.type === 'rhombus' ||
    result.type === 'parallelogram' ||
    result.type === 'trapezoid' ||
    result.type === 'quadrilateral'
  ) {
    const b = safeBbox
    const v =
      result.vertices && result.vertices.length >= 4
        ? result.vertices
        : [
          { nx: b.minX, ny: b.minY },
          { nx: b.maxX, ny: b.minY },
          { nx: b.maxX, ny: b.maxY },
          { nx: b.minX, ny: b.maxY },
        ]
    const A = { id: 'A', label: 'A', nx: v[0].nx, ny: v[0].ny }
    const B = { id: 'B', label: 'B', nx: v[1].nx, ny: v[1].ny }
    const C = { id: 'C', label: 'C', nx: v[2].nx, ny: v[2].ny }
    const D = { id: 'D', label: 'D', nx: v[3].nx, ny: v[3].ny }
    const isSquare = result.type === 'square'
    const isRhombus = result.type === 'rhombus'
    const isParallelogram = result.type === 'parallelogram'
    const isTrapezoid = result.type === 'trapezoid'
    const segments = [
      {
        id: 's_AB',
        from: 'A',
        to: 'B',
        dashed: false,
        equalTicks: isSquare || isRhombus ? 1 : 0,
        parallelMark: isParallelogram || isTrapezoid ? 1 : 0,
      },
      {
        id: 's_BC',
        from: 'B',
        to: 'C',
        dashed: false,
        equalTicks: isSquare || isRhombus ? 1 : 0,
        parallelMark: isParallelogram ? 2 : 0,
      },
      {
        id: 's_CD',
        from: 'C',
        to: 'D',
        dashed: false,
        equalTicks: isSquare || isRhombus ? 1 : 0,
        parallelMark: isParallelogram || isTrapezoid ? 1 : 0,
      },
      {
        id: 's_DA',
        from: 'D',
        to: 'A',
        dashed: false,
        equalTicks: isSquare || isRhombus ? 1 : 0,
        parallelMark: isParallelogram ? 2 : 0,
      },
    ]
    const rightAngles = isRhombus ? [] : detectRightAngleMarkers([A, B, C, D], segments)
    return {
      id,
      type: result.type,
      name: getShapeLabel(result.type, result.subType),
      vertices: [A, B, C, D],
      segments,
      customPoints: [],
      rightAngles,
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  // 3. NGŨ GIÁC / LỤC GIÁC
  if (result.type === 'pentagon' || result.type === 'hexagon') {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const verts = (result.vertices || []).map((p, idx) => ({
      id: letters[idx] || `V${idx}`,
      label: letters[idx] || `V${idx}`,
      nx: p.nx,
      ny: p.ny,
    }))
    const segments = verts.map((vCurr, idx) => {
      const vNext = verts[(idx + 1) % verts.length]
      return {
        id: `s_${vCurr.id}${vNext.id}`,
        from: vCurr.id,
        to: vNext.id,
        dashed: false,
      }
    })
    return {
      id,
      type: result.type,
      name: getShapeLabel(result.type),
      vertices: verts,
      segments,
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: safeBbox,
    }
  }

  // 4. ĐƯỜNG TRÒN / ELIP (hoặc Đường tròn kèm dây cung/tam giác nội tiếp)
  if (result.type === 'circle' || result.type === 'ellipse' || result.type === 'circle_with_lines') {
    const cObj = result.circle || result
    const cx = cObj.cx ?? safeBbox.cx
    const cy = cObj.cy ?? safeBbox.cy
    const r = cObj.r ?? Math.max(safeBbox.width, safeBbox.height) / 2
    const vertices = [{ id: 'O', label: 'O', nx: cx, ny: cy, isCenter: true }]
    const segments = []
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'N']

    if (result.graph && result.graph.vertices.length) {
      result.graph.vertices.forEach((gv, idx) => {
        const lid = letters[idx] || `P${idx}`
        // Nếu đỉnh nằm gần đường tròn, bắt dính chính xác lên đường tròn tâm O bán kính r!
        const dToCenter = Math.hypot(gv.nx - cx, gv.ny - cy)
        let vx = gv.nx
        let vy = gv.ny
        if (Math.abs(dToCenter - r) < r * 0.25 && dToCenter > 1e-4) {
          vx = cx + ((gv.nx - cx) / dToCenter) * r
          vy = cy + ((gv.ny - cy) / dToCenter) * r
        }
        vertices.push({ id: lid, label: lid, nx: vx, ny: vy })
      })
      result.graph.edges.forEach((e, idx) => {
        const fromId = letters[e.u] || `P${e.u}`
        const toId = letters[e.v] || `P${e.v}`
        segments.push({ id: `s_${fromId}${toId}_${idx}`, from: fromId, to: toId, dashed: e.dashed })
      })
    }

    return {
      id,
      type: 'circle',
      name: result.graph ? 'Đường tròn (O) & Đa giác nội tiếp' : 'Đường tròn tâm O',
      center: vertices[0],
      radius: r,
      vertices,
      segments,
      customPoints: [],
      rightAngles: detectRightAngleMarkers(vertices, segments),
      activeTool: 'select',
      color,
      bbox: safeBbox,
    }
  }

  // 5. ĐỒ THỊ ĐỈNH - CẠNH THỰC TẾ DO CHÍNH NGƯỜI DÙNG VẼ (kể cả Hình không gian 3D, Hình bài tập, Đa giác...)
  // Bảo toàn 100% tọa độ đỉnh và cạnh do người dùng vẽ, nắn thẳng từng đoạn và bắt góc vuông tự nhiên!
  if (result.graph && result.graph.vertices && result.graph.vertices.length >= 3) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'M', 'N', 'P', 'Q', 'S', 'O']
    const sorted = [...result.graph.vertices].sort((a, b) => a.ny - b.ny || a.nx - b.nx)
    const idxToId = new Map()
    const vertices = sorted.map((v, i) => {
      const lid = letters[i] || `V${i + 1}`
      idxToId.set(v.idx, lid)
      return { id: lid, label: lid, nx: v.nx, ny: v.ny }
    })
    const segments = result.graph.edges.map((e, i) => {
      const from = idxToId.get(e.u)
      const to = idxToId.get(e.v)
      return {
        id: `s_${from}_${to}_${i}`,
        from,
        to,
        dashed: Boolean(e.dashed),
      }
    })
    const rightAngles = detectRightAngleMarkers(vertices, segments)
    const shapeLabel = getShapeLabel(result.type, result.subType)
    return {
      id,
      type: result.type || 'custom_graph',
      name: `${shapeLabel} (${vertices.length} đỉnh, ${segments.length} cạnh)`,
      vertices,
      segments,
      customPoints: [],
      rightAngles,
      activeTool: 'select',
      color,
      bbox: safeBbox,
    }
  }

  // 6. CÁC HÌNH KHÔNG GIAN 3D MẶC ĐỊNH (Chỉ dùng khi chèn từ menu mẫu, không có nét vẽ)
  if (result.type === 'trapezoid_prism') {
    return createSgkPresetGeometryShape('trapezoid_prism', safeBbox, color)
  }
  if (result.type === 'prism_3d') {
    return createSgkPresetGeometryShape('prism_abc', safeBbox, color)
  }
  if (result.type === 'tetrahedron_3d') {
    return createSgkPresetGeometryShape('tetrahedron_sabc', safeBbox, color)
  }
  if (result.type === 'pyramid_sa_perp_3d') {
    return createSgkPresetGeometryShape('pyramid_sa_perp', safeBbox, color)
  }
  if (result.type === 'pyramid_3d') {
    return createSgkPresetGeometryShape('pyramid_sabcd', safeBbox, color)
  }
  if (result.type === 'cube_3d') {
    const isRect = result.subType === 'rectangular_prism' || (safeBbox.width / Math.max(1e-4, safeBbox.height) > 1.10) || (safeBbox.width / Math.max(1e-4, safeBbox.height) < 0.90)
    const key = isRect ? 'box_abcd' : 'cube_abcd'
    return createSgkPresetGeometryShape(key, safeBbox, color)
  }

  if (result.type === 'line' || result.type === 'segment') {
    const p0 = result.p0 || { nx: safeBbox.minX, ny: safeBbox.minY }
    const p1 = result.p1 || { nx: safeBbox.maxX, ny: safeBbox.maxY }
    const A = { id: 'A', label: 'A', nx: p0.nx, ny: p0.ny }
    const B = { id: 'B', label: 'B', nx: p1.nx, ny: p1.ny }
    return {
      id,
      type: 'segment',
      name: 'Đoạn thẳng AB',
      vertices: [A, B],
      segments: [{ id: 's_AB', from: 'A', to: 'B', dashed: false }],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: safeBbox,
    }
  }

  // Mặc định: Tạo đa giác từ bounding box
  const b = safeBbox
  const A = { id: 'A', label: 'A', nx: b.minX, ny: b.minY }
  const B = { id: 'B', label: 'B', nx: b.maxX, ny: b.minY }
  const C = { id: 'C', label: 'C', nx: b.maxX, ny: b.maxY }
  const D = { id: 'D', label: 'D', nx: b.minX, ny: b.maxY }
  return {
    id,
    type: 'polygon',
    name: 'Hình học ABCD',
    vertices: [A, B, C, D],
    segments: [
      { id: 's_AB', from: 'A', to: 'B', dashed: false },
      { id: 's_BC', from: 'B', to: 'C', dashed: false },
      { id: 's_CD', from: 'C', to: 'D', dashed: false },
      { id: 's_DA', from: 'D', to: 'A', dashed: false },
    ],
    customPoints: [],
    rightAngles: [],
    activeTool: 'select',
    color,
    bbox: b,
  }
}

/**
 * DANH SÁCH CÁC MẪU HÌNH BÀI TẬP SGK TOÁN PHỔ THÔNG DÀNH CHO GIÁO VIÊN (2D & 3D)
 */
export const SGK_GEOMETRY_PRESETS = [
  {
    key: 'right_triangle_ah',
    category: '2D',
    icon: '📐',
    title: 'Tam giác vuông ABC & Đường cao AH',
    desc: 'Hệ thức lượng trong tam giác vuông (Lớp 9)',
  },
  {
    key: 'triangle_abc',
    category: '2D',
    icon: '🔺',
    title: 'Tam giác ABC nhọn chuẩn SGK',
    desc: 'Đặt trung điểm, trọng tâm, trực tâm',
  },
  {
    key: 'trapezoid_abcd',
    category: '2D',
    icon: '⏢',
    title: 'Hình thang cân / vuông ABCD',
    desc: 'Hai đáy AB // CD, dựng đường cao & đường chéo',
  },
  {
    key: 'parallelogram_abcd',
    category: '2D',
    icon: '▱',
    title: 'Hình bình hành ABCD',
    desc: 'Hai cặp cạnh đối song song & giao điểm 2 đường chéo',
  },
  {
    key: 'rhombus_abcd',
    category: '2D',
    icon: '❖',
    title: 'Hình thoi ABCD',
    desc: 'Bốn cạnh bằng nhau, hai đường chéo vuông góc tại O',
  },
  {
    key: 'inscribed_circle_abc',
    category: '2D',
    icon: '⭕',
    title: 'Đường tròn (O) ngoại tiếp ΔABC',
    desc: 'Hình học 9: Góc nội tiếp, tiếp tuyến, tứ giác nội tiếp',
  },
  {
    key: 'tetrahedron_sabc',
    category: '3D',
    icon: '⛰️',
    title: 'Tứ diện / Chóp tam giác S.ABC',
    desc: 'Cạnh đáy AC khuất nét đứt chuẩn SGK Lớp 11',
  },
  {
    key: 'pyramid_sa_perp',
    category: '3D',
    icon: '🏛️',
    title: 'Chóp S.ABCD có SA ⊥ (ABCD)',
    desc: 'Dạng bài kinh điển (SA vuông góc đáy, nét đứt SA, AD, AB)',
  },
  {
    key: 'pyramid_sabcd',
    category: '3D',
    icon: '⛺',
    title: 'Chóp tứ giác đều S.ABCD (Đường cao SO)',
    desc: 'Có giao điểm 2 đường chéo O và đường cao SO ⊥ (ABCD)',
  },
  {
    key: 'prism_abc',
    category: '3D',
    icon: '💎',
    title: "Lăng trụ đứng tam giác ABC.A'B'C'",
    desc: 'Hai đáy tam giác song song, 3 cạnh bên đứng',
  },
  {
    key: 'cube_abcd',
    category: '3D',
    icon: '🧊',
    title: "Hình hộp / Lập phương ABCD.A'B'C'D'",
    desc: 'Có sẵn 8 đỉnh & 3 cạnh khuất nét đứt để dựng thiết diện',
  },
]

/**
 * Khởi tạo nhanh đối tượng hình học chuẩn SGK từ preset key
 */
export function createSgkPresetGeometryShape(
  presetKey,
  bboxIn = null,
  color = '#f8fafc',
) {
  const id = `geom_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const b = bboxIn || {
    minX: 0.26,
    maxX: 0.68,
    minY: 0.16,
    maxY: 0.68,
    width: 0.42,
    height: 0.52,
    cx: 0.47,
    cy: 0.42,
  }

  if (presetKey === 'right_triangle_ah') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.36, ny: b.minY + b.height * 0.12 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.08, ny: b.maxY - b.height * 0.12 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.08, ny: b.maxY - b.height * 0.12 }
    const H = { id: 'H', label: 'H', nx: A.nx, ny: B.ny }
    return {
      id,
      type: 'triangle',
      name: 'Tam giác vuông ABC (Đường cao AH)',
      vertices: [A, B, C, H],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CA', from: 'C', to: 'A', dashed: false },
        { id: 's_AH', from: 'A', to: 'H', dashed: true },
      ],
      customPoints: [],
      rightAngles: [
        { vertex: 'A', leg1: 'B', leg2: 'C' },
        { vertex: 'H', leg1: 'A', leg2: 'C' },
      ],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'equilateral_triangle') {
    const side = Math.min(b.width, b.height * 1.15) * 0.82
    const cx = b.cx
    const h = (side * Math.sqrt(3)) / 2
    const A = { id: 'A', label: 'A', nx: cx, ny: b.cy - h * 0.55 }
    const B = { id: 'B', label: 'B', nx: cx - side / 2, ny: b.cy + h * 0.45 }
    const C = { id: 'C', label: 'C', nx: cx + side / 2, ny: b.cy + h * 0.45 }
    return {
      id,
      type: 'triangle',
      subType: 'equilateral',
      name: 'Tam giác đều ABC (góc 60°)',
      vertices: [A, B, C],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CA', from: 'C', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'rectangle_abcd' || presetKey === 'rectangle') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.08, ny: b.minY + b.height * 0.15 }
    const B = { id: 'B', label: 'B', nx: b.maxX - b.width * 0.08, ny: b.minY + b.height * 0.15 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.08, ny: b.maxY - b.height * 0.15 }
    const D = { id: 'D', label: 'D', nx: b.minX + b.width * 0.08, ny: b.maxY - b.height * 0.15 }
    return {
      id,
      type: 'rectangle',
      name: 'Hình chữ nhật ABCD',
      vertices: [A, B, C, D],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [
        { vertex: 'A', leg1: 'B', leg2: 'D' },
        { vertex: 'B', leg1: 'A', leg2: 'C' },
        { vertex: 'C', leg1: 'B', leg2: 'D' },
        { vertex: 'D', leg1: 'A', leg2: 'C' },
      ],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'square_abcd' || presetKey === 'square') {
    const sz = Math.min(b.width, b.height) * 0.74
    const A = { id: 'A', label: 'A', nx: b.cx - sz / 2, ny: b.cy - sz / 2 }
    const B = { id: 'B', label: 'B', nx: b.cx + sz / 2, ny: b.cy - sz / 2 }
    const C = { id: 'C', label: 'C', nx: b.cx + sz / 2, ny: b.cy + sz / 2 }
    const D = { id: 'D', label: 'D', nx: b.cx - sz / 2, ny: b.cy + sz / 2 }
    return {
      id,
      type: 'square',
      name: 'Hình vuông ABCD',
      vertices: [A, B, C, D],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [
        { vertex: 'A', leg1: 'B', leg2: 'D' },
        { vertex: 'B', leg1: 'A', leg2: 'C' },
        { vertex: 'C', leg1: 'B', leg2: 'D' },
        { vertex: 'D', leg1: 'A', leg2: 'C' },
      ],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'triangle_abc') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.38, ny: b.minY + b.height * 0.1 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.08, ny: b.maxY - b.height * 0.1 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.08, ny: b.maxY - b.height * 0.1 }
    return {
      id,
      type: 'triangle',
      name: 'Tam giác ABC',
      vertices: [A, B, C],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CA', from: 'C', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'trapezoid_abcd') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.24, ny: b.minY + b.height * 0.18 }
    const B = { id: 'B', label: 'B', nx: b.maxX - b.width * 0.24, ny: b.minY + b.height * 0.18 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.06, ny: b.maxY - b.height * 0.15 }
    const D = { id: 'D', label: 'D', nx: b.minX + b.width * 0.06, ny: b.maxY - b.height * 0.15 }
    return {
      id,
      type: 'trapezoid',
      name: 'Hình thang cân ABCD (AB // CD)',
      vertices: [A, B, C, D],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'parallelogram_abcd') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.22, ny: b.minY + b.height * 0.18 }
    const B = { id: 'B', label: 'B', nx: b.maxX - b.width * 0.06, ny: b.minY + b.height * 0.18 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.22, ny: b.maxY - b.height * 0.16 }
    const D = { id: 'D', label: 'D', nx: b.minX + b.width * 0.06, ny: b.maxY - b.height * 0.16 }
    return {
      id,
      type: 'parallelogram',
      name: 'Hình bình hành ABCD',
      vertices: [A, B, C, D],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'rhombus_abcd') {
    const A = { id: 'A', label: 'A', nx: b.cx, ny: b.minY + b.height * 0.1 }
    const B = { id: 'B', label: 'B', nx: b.maxX - b.width * 0.1, ny: b.cy }
    const C = { id: 'C', label: 'C', nx: b.cx, ny: b.maxY - b.height * 0.1 }
    const D = { id: 'D', label: 'D', nx: b.minX + b.width * 0.1, ny: b.cy }
    const O = { id: 'O', label: 'O', nx: b.cx, ny: b.cy }
    return {
      id,
      type: 'rhombus',
      name: 'Hình thoi ABCD (Tâm O)',
      vertices: [A, B, C, D, O],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
        { id: 's_AC', from: 'A', to: 'C', dashed: true },
        { id: 's_BD', from: 'B', to: 'D', dashed: true },
      ],
      customPoints: [],
      rightAngles: [{ vertex: 'O', leg1: 'A', leg2: 'B' }],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'inscribed_circle_abc') {
    const r = Math.min(b.width, b.height) * 0.38
    const cx = b.cx
    const cy = b.cy
    const O = { id: 'O', label: 'O', nx: cx, ny: cy, isCenter: true }
    const A = { id: 'A', label: 'A', nx: cx + r * Math.cos(-1.35), ny: cy + r * Math.sin(-1.35) }
    const B = { id: 'B', label: 'B', nx: cx + r * Math.cos(2.5), ny: cy + r * Math.sin(2.5) }
    const C = { id: 'C', label: 'C', nx: cx + r * Math.cos(0.55), ny: cy + r * Math.sin(0.55) }
    return {
      id,
      type: 'circle',
      name: 'Đường tròn (O) ngoại tiếp ΔABC',
      center: O,
      radius: r,
      vertices: [O, A, B, C],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CA', from: 'C', to: 'A', dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'tetrahedron_sabc') {
    const S = { id: 'S', label: 'S', nx: b.minX + b.width * 0.44, ny: b.minY + b.height * 0.06 }
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.08, ny: b.maxY - b.height * 0.24 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.42, ny: b.maxY - b.height * 0.04 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.06, ny: b.maxY - b.height * 0.22 }
    return {
      id,
      type: 'pyramid_3d',
      name: 'Tứ diện / Chóp tam giác S.ABC',
      is3d: true,
      vertices: [S, A, B, C],
      segments: [
        { id: 's_SA', from: 'S', to: 'A', dashed: false },
        { id: 's_SB', from: 'S', to: 'B', dashed: false },
        { id: 's_SC', from: 'S', to: 'C', dashed: false },
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_AC', from: 'A', to: 'C', dashed: true },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'pyramid_sa_perp') {
    // Hình chóp S.ABCD có SA ⊥ (ABCD), đáy ABCD là hình bình hành/chữ nhật phối cảnh
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.26, ny: b.maxY - b.height * 0.34 }
    const S = { id: 'S', label: 'S', nx: A.nx, ny: b.minY + b.height * 0.05 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.06, ny: b.maxY - b.height * 0.06 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.24, ny: b.maxY - b.height * 0.06 }
    const D = { id: 'D', label: 'D', nx: b.maxX - b.width * 0.04, ny: b.maxY - b.height * 0.34 }
    return {
      id,
      type: 'pyramid_3d',
      name: 'Hình chóp S.ABCD (SA ⊥ đáy)',
      is3d: true,
      vertices: [S, A, B, C, D],
      segments: [
        { id: 's_SB', from: 'S', to: 'B', dashed: false },
        { id: 's_SC', from: 'S', to: 'C', dashed: false },
        { id: 's_SD', from: 'S', to: 'D', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_SA', from: 'S', to: 'A', dashed: true },
        { id: 's_AB', from: 'A', to: 'B', dashed: true },
        { id: 's_AD', from: 'A', to: 'D', dashed: true },
      ],
      customPoints: [],
      rightAngles: [
        { vertex: 'A', leg1: 'S', leg2: 'D' },
        { vertex: 'A', leg1: 'S', leg2: 'B' },
      ],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'pyramid_sabcd') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.26, ny: b.maxY - b.height * 0.34 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.06, ny: b.maxY - b.height * 0.06 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.24, ny: b.maxY - b.height * 0.06 }
    const D = { id: 'D', label: 'D', nx: b.maxX - b.width * 0.04, ny: b.maxY - b.height * 0.34 }
    const O = { id: 'O', label: 'O', nx: (A.nx + C.nx) / 2, ny: (A.ny + C.ny) / 2 }
    const S = { id: 'S', label: 'S', nx: O.nx, ny: b.minY + b.height * 0.05 }
    return {
      id,
      type: 'pyramid_3d',
      name: 'Hình chóp đều S.ABCD (Đường cao SO)',
      is3d: true,
      vertices: [S, A, B, C, D, O],
      segments: [
        { id: 's_SB', from: 'S', to: 'B', dashed: false },
        { id: 's_SC', from: 'S', to: 'C', dashed: false },
        { id: 's_SD', from: 'S', to: 'D', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_SA', from: 'S', to: 'A', dashed: true },
        { id: 's_AB', from: 'A', to: 'B', dashed: true },
        { id: 's_AD', from: 'A', to: 'D', dashed: true },
        { id: 's_AC', from: 'A', to: 'C', dashed: true },
        { id: 's_BD', from: 'B', to: 'D', dashed: true },
        { id: 's_SO', from: 'S', to: 'O', dashed: true },
      ],
      customPoints: [],
      rightAngles: [{ vertex: 'O', leg1: 'S', leg2: 'D' }],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'prism_abc') {
    const A = { id: 'A', label: 'A', nx: b.minX + b.width * 0.1, ny: b.maxY - b.height * 0.22 }
    const B = { id: 'B', label: 'B', nx: b.minX + b.width * 0.45, ny: b.maxY - b.height * 0.04 }
    const C = { id: 'C', label: 'C', nx: b.maxX - b.width * 0.1, ny: b.maxY - b.height * 0.22 }
    const dy = b.height * 0.58
    const A1 = { id: "A'", label: "A'", nx: A.nx, ny: A.ny - dy }
    const B1 = { id: "B'", label: "B'", nx: B.nx, ny: B.ny - dy }
    const C1 = { id: "C'", label: "C'", nx: C.nx, ny: C.ny - dy }
    return {
      id,
      type: 'prism_3d',
      name: "Hình lăng trụ đứng ABC.A'B'C'",
      is3d: true,
      vertices: [A, B, C, A1, B1, C1],
      segments: [
        { id: 's_A1B1', from: "A'", to: "B'", dashed: false },
        { id: 's_B1C1', from: "B'", to: "C'", dashed: false },
        { id: 's_C1A1', from: "C'", to: "A'", dashed: false },
        { id: 's_AA1', from: 'A', to: "A'", dashed: false },
        { id: 's_BB1', from: 'B', to: "B'", dashed: false },
        { id: 's_CC1', from: 'C', to: "C'", dashed: false },
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_AC', from: 'A', to: 'C', dashed: true },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  if (presetKey === 'trapezoid_prism') {
    const ox = b.minX
    const oy = b.minY
    const w = b.width * 0.74
    const h = b.height * 0.74
    const dx = b.width * 0.26
    const dy = -b.height * 0.24
    // Đáy dưới ABCD (A: trước trái, B: trước phải, C: sau phải, D: sau trái)
    const A = { id: 'A', label: 'A', nx: ox, ny: oy - dy + h }
    const B = { id: 'B', label: 'B', nx: ox + w, ny: oy - dy + h }
    const C = { id: 'C', label: 'C', nx: ox + w + dx, ny: oy + h }
    const D = { id: 'D', label: 'D', nx: ox + dx, ny: oy + h }
    // Mặt trên vát chéo: A' cao, B' thấp hơn (mái dốc)
    const A1 = { id: "A'", label: "A'", nx: ox, ny: oy - dy }
    const B1 = { id: "B'", label: "B'", nx: ox + w, ny: oy - dy + h * 0.45 }
    const C1 = { id: "C'", label: "C'", nx: ox + w + dx, ny: oy + h * 0.45 }
    const D1 = { id: "D'", label: "D'", nx: ox + dx, ny: oy }
    return {
      id,
      type: 'trapezoid_prism',
      subType: 'truncated_prism',
      name: 'Khối lăng trụ vát / đáy hình thang',
      is3d: true,
      vertices: [A, B, C, D, A1, B1, C1, D1],
      segments: [
        { id: 's_AB', from: 'A', to: 'B', dashed: false },
        { id: 's_BC', from: 'B', to: 'C', dashed: false },
        { id: 's_CD', from: 'C', to: 'D', dashed: false },
        { id: 's_DA', from: 'D', to: 'A', dashed: false },
        { id: 's_AA1', from: 'A', to: "A'", dashed: false },
        { id: 's_BB1', from: 'B', to: "B'", dashed: false },
        { id: 's_CC1', from: 'C', to: "C'", dashed: false },
        { id: 's_DD1', from: 'D', to: "D'", dashed: true },
        { id: 's_A1B1', from: "A'", to: "B'", dashed: false },
        { id: 's_B1C1', from: "B'", to: "C'", dashed: false },
        { id: 's_C1D1', from: "C'", to: "D'", dashed: false },
        { id: 's_D1A1', from: "D'", to: "A'", dashed: false },
      ],
      customPoints: [],
      rightAngles: [],
      activeTool: 'select',
      color,
      bbox: b,
    }
  }

  // Mặc định: Hình lập phương ABCD.A'B'C'D' hoặc Hình hộp chữ nhật
  const ox = b.minX
  const oy = b.minY
  const isBox =
    presetKey === 'box_abcd' ||
    (b.width / Math.max(1e-4, b.height) > 1.12) ||
    (b.width / Math.max(1e-4, b.height) < 0.88)
  const w = b.width * (isBox ? 0.76 : 0.72)
  const h = b.height * (isBox ? 0.76 : 0.72)
  const dx = b.width * (isBox ? 0.24 : 0.28)
  const dy = -b.height * (isBox ? 0.24 : 0.28)
  const A = { id: 'A', label: 'A', nx: ox, ny: oy - dy + h }
  const B = { id: 'B', label: 'B', nx: ox + w, ny: oy - dy + h }
  const C = { id: 'C', label: 'C', nx: ox + w, ny: oy - dy }
  const D = { id: 'D', label: 'D', nx: ox, ny: oy - dy }
  const A1 = { id: "A'", label: "A'", nx: ox + dx, ny: oy + h }
  const B1 = { id: "B'", label: "B'", nx: ox + w + dx, ny: oy + h }
  const C1 = { id: "C'", label: "C'", nx: ox + w + dx, ny: oy }
  const D1 = { id: "D'", label: "D'", nx: ox + dx, ny: oy }

  return {
    id,
    type: 'cube_3d',
    subType: isBox ? 'rectangular_prism' : 'cube',
    name: isBox ? "Hình hộp chữ nhật ABCD.A'B'C'D'" : "Hình lập phương ABCD.A'B'C'D'",
    is3d: true,
    vertices: [A, B, C, D, A1, B1, C1, D1],
    segments: [
      { id: 's_DC', from: 'D', to: 'C', dashed: false },
      { id: 's_CB', from: 'C', to: 'B', dashed: false },
      { id: 's_BA', from: 'B', to: 'A', dashed: false },
      { id: 's_AD', from: 'A', to: 'D', dashed: false },
      { id: 's_DD1', from: 'D', to: "D'", dashed: false },
      { id: 's_D1C1', from: "D'", to: "C'", dashed: false },
      { id: 's_C1C', from: "C'", to: 'C', dashed: false },
      { id: 's_C1B1', from: "C'", to: "B'", dashed: false },
      { id: 's_B1B', from: "B'", to: 'B', dashed: false },
      { id: 's_A1D1', from: "A'", to: "D'", dashed: true },
      { id: 's_A1B1', from: "A'", to: "B'", dashed: true },
      { id: 's_A1A', from: "A'", to: 'A', dashed: true },
    ],
    customPoints: [],
    rightAngles: [],
    activeTool: 'select',
    color,
    bbox: b,
  }
}

/**
 * Tạo các nét viết tay mẫu y = x^2 - 3 và y = A sin x + B giống hệt video (00:01 - 00:14)
 */
export function generateSampleVideoEquations(color = '#f8fafc', width = 2.6) {
  const ts = Date.now()
  let idx = 0
  const mk = (pts) => ({
    id: `eq_sample_${ts}_${idx++}`,
    color,
    width,
    points: pts.map(([nx, ny]) => ({ nx, ny })),
  })

  const line1 = [
    mk([[0.56, 0.30], [0.565, 0.33], [0.573, 0.30]]),
    mk([[0.573, 0.30], [0.568, 0.365], [0.558, 0.375]]),
    mk([[0.588, 0.315], [0.606, 0.315]]),
    mk([[0.588, 0.330], [0.606, 0.330]]),
    mk([[0.620, 0.302], [0.638, 0.340]]),
    mk([[0.638, 0.302], [0.620, 0.340]]),
    mk([[0.644, 0.282], [0.654, 0.278], [0.656, 0.288], [0.644, 0.302], [0.658, 0.302]]),
    mk([[0.670, 0.322], [0.690, 0.322]]),
    mk([[0.704, 0.295], [0.720, 0.295], [0.712, 0.315], [0.722, 0.328], [0.718, 0.342], [0.702, 0.342]]),
  ]

  const line2 = [
    mk([[0.555, 0.45], [0.560, 0.48], [0.568, 0.45]]),
    mk([[0.568, 0.45], [0.562, 0.515], [0.552, 0.525]]),
    mk([[0.582, 0.465], [0.600, 0.465]]),
    mk([[0.582, 0.480], [0.600, 0.480]]),
    mk([[0.614, 0.495], [0.624, 0.440], [0.634, 0.495]]),
    mk([[0.617, 0.474], [0.631, 0.474]]),
    mk([[0.654, 0.458], [0.644, 0.462], [0.645, 0.474], [0.655, 0.482], [0.643, 0.492]]),
    mk([[0.665, 0.460], [0.665, 0.492]]),
    mk([[0.665, 0.446], [0.666, 0.448]]),
    mk([[0.676, 0.462], [0.676, 0.492], [0.684, 0.464], [0.690, 0.492]]),
    mk([[0.704, 0.460], [0.720, 0.492]]),
    mk([[0.720, 0.460], [0.704, 0.492]]),
    mk([[0.735, 0.475], [0.753, 0.475]]),
    mk([[0.744, 0.460], [0.744, 0.490]]),
    mk([[0.766, 0.442], [0.766, 0.494]]),
    mk([[0.766, 0.442], [0.782, 0.446], [0.782, 0.465], [0.766, 0.468], [0.785, 0.475], [0.784, 0.492], [0.766, 0.494]]),
  ]

  return {
    strokes: [...line1, ...line2],
    region: { nx0: 0.535, ny0: 0.255, nx1: 0.805, ny1: 0.545 },
  }
}
