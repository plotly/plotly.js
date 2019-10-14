/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'locale',
    name: 'zh-CN',
    dictionary: {
        'Autoscale': '自动缩放',                                                               // components/modebar/buttons.js:139
        'Box Select': '矩形选择',                                                              // components/modebar/buttons.js:103
        'Click to enter Colorscale title': '点击输入色阶的标题',                               // plots/plots.js:437
        'Click to enter Component A title': '点击输入组件 A 的标题',                           // plots/ternary/ternary.js:386
        'Click to enter Component B title': '点击输入组件 B 的标题',                           // plots/ternary/ternary.js:400
        'Click to enter Component C title': '点击输入组件 C 的标题',                           // plots/ternary/ternary.js:411
        'Click to enter Plot title': '点击输入图表的标题',                                     // plot_api/plot_api.js:579
        'Click to enter X axis title': '点击输入 X 轴的标题',                                  // plots/plots.js:435
        'Click to enter Y axis title': '点击输入 Y 轴的标题',                                  // plots/plots.js:436
        'Compare data on hover': '悬停时比较数据',                                             // components/modebar/buttons.js:167
        'Double-click on legend to isolate one trace': '双击图例',                             // components/legend/handle_click.js:90
        'Double-click to zoom back out': '双击返回缩小显示',                                   // plots/cartesian/dragbox.js:299
        'Download plot as a png': '下载图表为 PNG',                                            // components/modebar/buttons.js:52
        'Download plot': '下载图表',                                                           // components/modebar/buttons.js:53
        'Edit in Chart Studio': '在 Chart Studio 中编辑',                                      // components/modebar/buttons.js:76
        'IE only supports svg.  Changing format to svg.': 'IE 只支持 SVG。转换格式为 SVG。',   // components/modebar/buttons.js:60
        'Lasso Select': '套索选择',                                                            // components/modebar/buttons.js:112
        'Orbital rotation': '轨道旋转',                                                        // components/modebar/buttons.js:279
        'Pan': '扩大',                                                                         // components/modebar/buttons.js:94
        'Produced with Plotly': '由 Plotly 生成',                                              // components/modebar/modebar.js:256
        'Reset': '重置',                                                                       // components/modebar/buttons.js:432
        'Reset axes': '重置轴',                                                                // components/modebar/buttons.js:148
        'Reset camera to default': '重置镜头到默认',                                           // components/modebar/buttons.js:314
        'Reset camera to last save': '重置镜头到最后一次保存',                                 // components/modebar/buttons.js:322
        'Reset view': '重置视图',                                                              // components/modebar/buttons.js:583
        'Reset views': '重置视图',                                                             // components/modebar/buttons.js:529
        'Show closest data on hover': '悬停时显示最近的数据',                                  // components/modebar/buttons.js:157
        'Snapshot succeeded': '生成快照成功',                                                  // components/modebar/buttons.js:66
        'Sorry, there was a problem downloading your snapshot!': '对不起，下载快照出现问题！', // components/modebar/buttons.js:69
        'Taking snapshot - this may take a few seconds': '正在生成快照 - 可能需要几秒钟',      // components/modebar/buttons.js:57
        'Zoom': '缩放',                                                                        // components/modebar/buttons.js:85
        'Zoom in': '放大',                                                                     // components/modebar/buttons.js:121
        'Zoom out': '缩小',                                                                    // components/modebar/buttons.js:130
        'close:': '关:',                                                                       // traces/ohlc/transform.js:139
        'trace': '踪迹:',                                                                      // plots/plots.js:439
        'lat:': '纬度:',                                                                       // traces/scattergeo/calc.js:48
        'lon:': '经度:',                                                                       // traces/scattergeo/calc.js:49
        'q1:': '第一四分位数:',                                                                // traces/box/calc.js:130
        'q3:': '第三四分位数:',                                                                // traces/box/calc.js:131
        'source:': '源:',                                                                      // traces/sankey/plot.js:140
        'target:': '目标:',                                                                    // traces/sankey/plot.js:141
        'lower fence:': 'Fence 的下限:',                                                       // traces/box/calc.js:134
        'upper fence:': 'Fence 的上限:',                                                       // traces/box/calc.js:135
        'max:': '最大:',                                                                       // traces/box/calc.js:132
        'mean ± σ:': '平均 ± σ:',                                                              // traces/box/calc.js:133
        'mean:': '平均:',                                                                      // traces/box/calc.js:133
        'median:': '中位:',                                                                    // traces/box/calc.js:128
        'min:': '最小:',                                                                       // traces/box/calc.js:129
        'Turntable rotation': '按轴旋转:',                                                     // components/modebar/buttons.js:288
        'Toggle Spike Lines': '是否显示 Spike Lines',                                          // components/modebar/buttons.js:548
        'open:': '开:',                                                                        // traces/ohlc/transform.js:136
        'high:': '高:',                                                                        // traces/ohlc/transform.js:137
        'low:': '低:',                                                                         // traces/ohlc/transform.js:138
        'Toggle show closest data on hover': '悬停时是否显示最近的数据',                       // components/modebar/buttons.js:353
        'incoming flow count:': '流入数量:',                                                   // traces/sankey/plot.js:142
        'outgoing flow count:': '流出数量:',                                                   // traces/sankey/plot.js:143
        'kde:': 'kde:',                                                                        // traces/violin/calc.js:73
        'Click to enter radial axis title': '点击输入放射轴标题',
        'new text': '新建文本'
    },
    format: {
        days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
        shortDays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        shortMonths: ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'],
        date: '%Y-%m-%d'
    }
};
