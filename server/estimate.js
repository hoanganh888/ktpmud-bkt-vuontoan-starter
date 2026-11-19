'use strict';

function evaluateEstimate(estimate, answer, deltaPercent = 10) {
  const value = Number(estimate);
  const target = Number(answer);
  const percent = Number(deltaPercent);
  if (!Number.isFinite(value) || !Number.isFinite(target) ) {
    return { status: 'unknown', message: 'Em hãy nhập một số hợp lệ nhé.' };
  }
  if (value === target) {
    return { status: 'exact', message: 'Kết quả ước lượng khớp với kết quả chính xác.' };
  }
  // Với đáp án bằng 0, dùng ngưỡng tối thiểu 1 đơn vị để vẫn có vùng sai số hữu ích.
  const tolerance = Math.max(Math.abs(target) * percent / 100, target === 0 ? 1 : 0);
  const difference = value - target;
  if (Math.abs(difference) <= tolerance) {
    return {
      status: difference > 0 ? 'within_above' : 'within_below',
      message: difference > 0
        ? 'Giá trị ước lượng nằm trên kết quả chính xác nhưng vẫn trong sai số cho phép.'
        : 'Giá trị ước lượng nằm dưới kết quả chính xác nhưng vẫn trong sai số cho phép.'
    };
  }
  return { status: 'outside', message: 'Giá trị ước lượng nằm ngoài sai số cho phép.' };
}

function calculateEstimateScore(points, estimateStatus, exactAnswerCorrect) {
  const max = Math.max(0, Number(points) || 0);
  if (estimateStatus === 'exact') return max;
  const estimatePoints = estimateStatus === 'within_above' || estimateStatus === 'within_below'
    ? max * 0.5 : 0;
  const exactPoints = exactAnswerCorrect ? max * 0.5 : 0;
  return Math.round((estimatePoints + exactPoints) * 100) / 100;
}

module.exports = { evaluateEstimate, calculateEstimateScore };
