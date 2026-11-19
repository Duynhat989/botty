/** Canvas trống cho Bảng viết — không cần phân tích đề. */
export function createBlankWritingSpec() {
  return {
    mode: '2d',
    commands: [],
    params: [],
    rules: [],
    variables: [],
    title: '',
    notes: '',
    canvas: { width: 800, height: 560, background: '#2a2f36' },
  }
}
