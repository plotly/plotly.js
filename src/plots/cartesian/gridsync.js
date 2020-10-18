'use strict';

module.exports = {
  gridsync: gridsync
};

/**
 * Synchronize muli-axis gridlines
 *
 * @param {array} y1_values:
 *      array of values for y1-axis
 * @param {array} y2_values:
 *      array of values for y2-axis 
 * @param {integer} gridlines:
 *      amount of gridlines we want to span our grid
 * @return {array of objects}
 * 
 */
function gridsync(y1_values, y2_values, gridlines) {
  var y1 = {}
  var y2 = {}

  // add .min, .max, .range to obj
  _getMinMaxRange(y1, y1_values);
  _getMinMaxRange(y2, y2_values);

  // add .dtick, .dtick_ratio to obj
  _calcDtick(y1, gridlines);
  _calcDtick(y2, gridlines);

  var global_dtick_ratio = Math.max(y1.dtick_ratio, y2.dtick_ratio);

  // add .range_min to obj
  _calcRangeMin(y1, y2, global_dtick_ratio);
  // add .range_max to obj
  _calcRangeMax(y1, y2, global_dtick_ratio);

  return [y1, y2];
}


/**
 * Add minimum value, maximum value, and range of the values to the y-axis object.
 * 
 * @param {obj} y:
 *      object representing provided y-axis
 * @param {array} y_values:
 *      array of values for provided y-axis
 * @return {object}
 * 
 */
function _getMinMaxRange(y, y_values) {
  y.min = Math.min(...y_values)
  y.max = Math.max(...y_values)

  if (y.min < 0) {
      y.range = y.max - y.min
  } else {
      y.range = y.max
  }

  return y;
}


/**
 * Add dtick and dtick ratio to the y-axis object.
 *
 * @param {object} y:
 *      object representing provided y-axis
 * @param {integer} gridlines:
 *      amount of gridlines we want to span our grid
 * @return {object}
 */
function _calcDtick(y, gridlines) {
  var range = y.range * 1000;  // mult by 1000 to account for ranges < 1
  var len = Math.floor(range).toString().length;

  var pow10_divisor = Math.pow(10, len - 1);
  var firstdigit = Math.floor(range / pow10_divisor);
  var max_base = pow10_divisor * firstdigit / 1000;  // div by 1000 to account for ranges < 1

  y.dtick = max_base / gridlines;

  y.dtick_ratio = y.range / dtick;

  return y;
}


/**
 * Adjust all y-axes so that their range minimums are proportional to the global minimum ratio.
 * Add range_min to the y-axis objects.
 *
 * @param {object} y1:
 *      object representing the y1-axis
 * @param {object} y2:
 *      object representing the y2-axis
 * @param {number} global_dtick_ratio:
 *      the largest dtick ratio of all y-axes. used to scale all other axes
 * @return {array of objects}
 */
function _calcRangeMin(y1, y2, global_dtick_ratio) {
  var negative_ratios = {};
  var negative = false;  // Are there any negative values present
  
  if (y1.min < 0) {
    negative = true;
    negative_ratios.y1 = Math.abs(y1.min / y1.range) * global_dtick_ratio;
  } else {
    negative_ratios.y1 = 0;
  }
  
  if (y2.min < 0) {
    negative = true;
    negative_ratios.y2 = Math.abs(y2.min / y2.range) * global_dtick_ratio;
  } else {
    negative_ratios.y2 = 0;
  }
  
  // Increase the ratio by 0.1 so that your range minimums are extended just
  // far enough to not cut off any part of your lowest value
  var global_negative_ratio = Math.max(negative_ratios.y1, negative_ratios.y2) + 0.1;
  
  // If any negative value is present, you must proportionally extend the
  // range minimum of all axes
  if (negative) {
    y1.range_min = (global_negative_ratio) * y1.dtick * -1;
    y2.range_min = (global_negative_ratio) * y2.dtick * -1;
  } else {  // If no negatives, baseline is set to zero
    y1.range_min = 0;
    y2.range_min = 0;
  }
  
  return [y1, y2];
}


/**
 * Adjust all y-axes so that their range maximums are proportional to the global maximum ratio.
 * Add range_max to the y-axis objects.
 * 
 * @param {object} y1:
 *      object representing the y1-axis
 * @param {object} y2:
 *      object representing the y2-axis
 * @param {number} global_dtick_ratio:
 *      the largest dtick ratio of all y-axes. used to scale all other axes
 * @return {array of objects}
 *      
 */
function _calcRangeMax(y1, y2, global_dtick_ratio) {
  var positive_ratios = {}
  positive_ratios.y1 = Math.abs(y1.max / y1.range) * global_dtick_ratio;
  positive_ratios.y2 = Math.abs(y2.max / y2.range) * global_dtick_ratio;

  // Increase the ratio by 0.1 so that your range maximums are extended just
  // far enough to not cut off any part of your highest value
  var global_positive_ratio = Math.max(positive_ratios.y1, positive_ratios.y2) + 0.1;

  y1.range_max = (global_positive_ratio) * y1.dtick;
  y2.range_max = (global_positive_ratio) * y2.dtick;

  return [y1, y2];
}
