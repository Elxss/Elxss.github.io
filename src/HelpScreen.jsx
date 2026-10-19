import GradientText from './GradientText.jsx'
import { GRADIENTS } from './gradients.js'
import { EFFECTS } from './effects.js'
import { parseGradient } from './buffer.js'

const HELP = [
  ['^H', 'Display this help text'],
  ['^G', 'Open my GitHub'],
  ['^M', 'Copy my email address'],
  ['^S', 'Show a QR code to open this site on a phone'],
  ['^X', 'Close this help / close the buffer'],
  ['^O', 'Write the file out (read-only here)'],
  ['^R', 'Read the file back in after ^X'],
  ['^F', 'Search forward for a string'],
  ['^B', 'Search backward for a string'],
  ['M-F', 'Repeat the last search forward'],
  ['M-B', 'Repeat the last search backward'],
  ['^/', 'Go to a given line number'],
  ['^C', 'Copy the selection, or report the cursor position'],
  ['^K', 'Cut the current line into the cutbuffer'],
  ['^U', 'Paste the cutbuffer at the cursor'],
  ['M-U', 'Undo the last cut'],
  ['M-E', 'Redo the last undone cut'],
  ['^T', 'Execute a command'],
  ['^P', 'Refresh what I am playing'],
  ['Up/Down', 'Move the cursor one line'],
  ['Left/Right', 'Move between the links on the current line'],
  ['Enter', 'Open the focused link / run the focused button'],
  ['^Y / ^V', 'Scroll one page up / down'],
  ['Home/End', 'Jump to the first / last line'],
  ['Tab', 'Leave the buffer for the browser chrome'],
]

// The {{text}}(spec) syntax, each option with a live example.
const SAMPLE = 'gradient sample text'
const GRADIENT_HELP = [
  ['(preset)', 'A preset stretched over the text', 'purple_to_blue'],
  ['(#a>#b)', 'Your own colours, two or more (#rrggbb or #rgb)', '#ff5f6d>#ffc371'],
  ['*N', 'Repeat the ramp every N letters (A>B>A)', 'purple_to_blue*6'],
  ['/N', 'Cut the ramp into N solid steps', 'purple_to_blue/4'],
  ['~N', 'Slide the ramp N units a second', 'purple_to_blue*10~6'],
  ['+N', 'In a block: shift each line by N / set the slope', null],
  ['!shine.name', 'One glint through every span of that name, line after line', null],
]

const EFFECT_HELP = {
  shine: 'A white glint sweeps across',
  pulse: 'The text slowly breathes brighter',
  glitch: 'Short bursts of corrupted letters',
  decrypt: 'Scrambles, then decodes letter by letter',
}

/** `text` drawn with a gradient spec, animated like in the buffer. */
const Live = ({ spec, text = SAMPLE }) => (
  <GradientText text={text} start={0} span={parseGradient(spec)} hit={null} />
)

export default function HelpScreen() {
  return (
    <>
      <p>
        Help for the elxss buffer. <span className="dim">^</span> means Ctrl,{' '}
        <span className="dim">M-</span> means Alt.
      </p>
      <p className="dim">
        Some combinations (^T, ^W, ^N) are claimed by the browser and may never
        reach the page.
      </p>
      <div className="help-list">
        {HELP.map(([k, desc]) => (
          <div key={k} className="help-row">
            <span className="help-key">{k}</span>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      <p className="help-title">Colours and effects</p>
      <p className="dim">
        In the buffer, {'{{text}}(spec)'} colours a piece of text. Options chain
        in this order: preset*N/N~N+N!effect, e.g. fire*8/4~2!pulse.
      </p>
      <div className="help-list">
        {GRADIENT_HELP.map(([k, desc, spec]) => (
          <div key={k} className="help-row">
            <span className="help-key wide">{k}</span>
            <span className="help-desc">{desc}</span>
            {spec && <Live spec={spec} />}
          </div>
        ))}
        {Object.keys(EFFECTS).map((name) => (
          <div key={name} className="help-row">
            <span className="help-key wide">!{name}</span>
            <span className="help-desc">{EFFECT_HELP[name] || ''}</span>
            <Live spec={`cyan_to_purple!${name}`} />
          </div>
        ))}
      </div>

      <p className="help-title">Presets</p>
      <div className="help-list">
        {Object.keys(GRADIENTS).map((name) => (
          <div key={name} className="help-row">
            <span className="help-key wide">{name}</span>
            <Live spec={name} text={'\u2588'.repeat(24)} />
          </div>
        ))}
      </div>

      <p className="help-title">Drawings</p>
      <p className="dim">
        gradientBlock(rows, spec, direction) colours a multi-line drawing as one
        piece. direction: horizontal, vertical, or the corner the ramp starts
        from: top-left, top-right, bottom-left, bottom-right.
      </p>
    </>
  )
}
