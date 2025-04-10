'use strict';

module.exports = {
    moduleType: 'locale',
    name: 'zh-CN',
    dictionary: {
        'Autoscale': '自动缩放',                                                               // components/modebar/buttons.js:139
        'Box Select': '矩形框选',
        'Click to enter Colorscale title': '点击输入色阶的标题',                               // plots/plots.js:437
        'Click to enter Component A title': '点击输入组件A的标题',                           // plots/ternary/ternary.js:386
        'Click to enter Component B title': '点击输入组件B的标题',                           // plots/ternary/ternary.js:400
        'Click to enter Component C title': '点击输入组件C的标题',                           // plots/ternary/ternary.js:411
        'Click to enter Plot title': '点击输入图表的标题',                                     // plot_api/plot_api.js:579
        'Click to enter X axis title': '点击输入X轴的标题',                                  // plots/plots.js:435
        'Click to enter Y axis title': '点击输入Y轴的标题',                                  // plots/plots.js:436
        'Compare data on hover': '悬停时比较数据',                                             // components/modebar/buttons.js:167
        'Double-click on legend to isolate one trace': '双击图例来突显对应轨迹',
        'Double-click to zoom back out': '双击返回缩小显示',                                   // plots/cartesian/dragbox.js:299
        'Download plot as a PNG': '下载图表为PNG格式',
        'Download plot': '下载图表',                                                           // components/modebar/buttons.js:53
        'Edit in Chart Studio': '在Chart Studio中编辑',                                      // components/modebar/buttons.js:76
        'IE only supports svg.  Changing format to svg.': 'IE只支持SVG。转换格式为SVG。',   // components/modebar/buttons.js:60
        'Lasso Select': '套索选择',                                                            // components/modebar/buttons.js:112
        'Orbital rotation': '轨道旋转',                                                        // components/modebar/buttons.js:279
        'Pan': '平移',
        'Produced with Plotly.js': '由Plotly.js生成',                                        // components/modebar/modebar.js:256
        'Reset': '重置',                                                                       // components/modebar/buttons.js:432
        'Reset axes': '重置轴',                                                                // components/modebar/buttons.js:148
        'Reset camera to default': '重置镜头视角为默认状态',
        'Reset camera to last save': '重置镜头视角为上次保存状态',
        'Reset view': '重置视图',                                                              // components/modebar/buttons.js:583
        'Reset views': '重置视图',                                                             // components/modebar/buttons.js:529
        'Show closest data on hover': '悬停时显示最近的数据',                                  // components/modebar/buttons.js:157
        'Snapshot succeeded': '生成快照成功',                                                  // components/modebar/buttons.js:66
        'Sorry, there was a problem downloading your snapshot!': '抱歉，下载快照出现问题！',   // components/modebar/buttons.js:69
        'Taking snapshot - this may take a few seconds': '正在生成快照 - 可能需要几秒钟',      // components/modebar/buttons.js:57
        'Zoom': '缩放',                                                                        // components/modebar/buttons.js:85
        'Zoom in': '放大',                                                                     // components/modebar/buttons.js:121
        'Zoom out': '缩小',                                                                    // components/modebar/buttons.js:130
        'close:': '关闭:',
        'trace': '踪迹:',                                                                      // plots/plots.js:439
        'lat:': '纬度:',                                                                       // traces/scattergeo/calc.js:48
        'lon:': '经度:',                                                                       // traces/scattergeo/calc.js:49
        'q1:': '第一四分位数:',                                                                // traces/box/calc.js:130
        'q3:': '第三四分位数:',                                                                // traces/box/calc.js:131
        'source:': '源:',                                                                      // traces/sankey/plot.js:140
        'target:': '目标:',                                                                    // traces/sankey/plot.js:141
        'lower fence:': '内侧栏(lower fence):',
        'upper fence:': '外侧栏(upper fence):',
        'max:': '最大值:',
        'mean ± σ:': '平均数 ± 标准差σ:',
        'mean:': '平均数:',
        'median:': '中位数:',
        'min:': '最小值:',
        'Turntable rotation': '旋转转盘:',
        'Toggle Spike Lines': '切换显示数据点辅助线(Spike Lines)',
        'open:': '打开:',
        'high:': '高:',                                                                        // traces/ohlc/transform.js:137
        'low:': '低:',                                                                         // traces/ohlc/transform.js:138
        'Toggle show closest data on hover': '切换悬停时显示最近的数据点',
        'incoming flow count:': '流入数量:',                                                   // traces/sankey/plot.js:142
        'outgoing flow count:': '流出数量:',                                                   // traces/sankey/plot.js:143
        'kde:': 'kde:',                                                                        // traces/violin/calc.js:73
        'Click to enter radial axis title': '点击输入径向轴标题',
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
