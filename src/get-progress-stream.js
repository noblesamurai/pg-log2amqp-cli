const progress = require('progress-stream');
const { LogFrame, CompositeLogView, RawLogView } = require('log-frame');
const { ProgressBar } = require('logf-progress');

module.exports = function createProgressStream (count) {
  const stream = progress({ objectMode: true, length: parseInt(count), time: 1000 });
  const view = new CompositeLogView();
  const frame = new LogFrame({ hideCursor: true });
  frame.view = view;
  const bar = new ProgressBar();
  const label = new RawLogView();
  view.addChild(bar);
  view.addChild(label);
  stream.on('progress', update);

  function update (progress) {
    bar.setProgress(progress.percentage / 100);
    label.content = ` - ${progress.percentage.toFixed(2)}% ${progress.length - progress.remaining}/${progress.length}`;
  }

  function complete () {
    bar.setProgress(1);
    label.content = ' - complete';
  }

  return { stream, complete };
};
