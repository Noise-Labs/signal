import { ISize } from "common/geometry"
import { Beat } from "common/measure"
import { LoopSetting } from "common/player"
import SelectionModel from "common/selection/SelectionModel"
import Theme from "common/theme/Theme"
import Track, { TrackEvent } from "common/track"
import { NoteCoordTransform } from "common/transform"
import { show as showEventEditor } from "components/EventEditor/EventEditor"
import { HorizontalScaleScrollBar } from "components/inputs/ScaleScrollBar"
import { BAR_WIDTH, VerticalScrollBar } from "components/inputs/ScrollBar"
import mapBeats from "helpers/mapBeats"
import { Dispatcher } from "main/createDispatcher"
import React, { StatelessComponent } from "react"
import SplitPane from "react-split-pane"
import ControlPane from "./ControlPane"
import PianoControlEvents, { DisplayEvent } from "./PianoControlEvents"
import PianoCursor from "./PianoCursor"
import PianoGrid from "./PianoGrid"
import PianoKeys from "./PianoKeys"
import PianoLines from "./PianoLines"
import PianoNotes, { PianoNotesMouseEvent } from "./PianoNotes/PianoNotes"
import PianoRuler from "./PianoRuler"
import PianoSelection from "./PianoSelection"

import "./PianoRoll.css"

const SCROLL_KEY_SPEED = 4

export interface PianoNotesMouseHandler {
  onMouseDown(e: PianoNotesMouseEvent<MouseEvent>): void
  onMouseMove(e: PianoNotesMouseEvent<MouseEvent>): void
  onMouseUp(e: PianoNotesMouseEvent<MouseEvent>): void
}

export interface PianoRollProps {
  dispatch: Dispatcher
  mouseHandler: PianoNotesMouseHandler
  theme: Theme
  track: Track
  events: TrackEvent[]
  transform: NoteCoordTransform
  beats: Beat[]
  endTick: number
  mouseMode: number
  selection: SelectionModel
  alphaHeight: number
  scrollLeft: number
  scrollTop: number
  setScrollLeft: (scroll: number) => void
  setScrollTop: (scroll: number) => void
  controlMode: string
  setControlMode: (mode: string) => void
  notesCursor: string
  cursorPosition: number
  onMountAlpha: (ref: HTMLElement) => void
  loop: LoopSetting
  setLoopBegin: (tick: number) => void
  setLoopEnd: (tick: number) => void
  size: ISize
  onClickScaleUp: () => void
  onClickScaleDown: () => void
  onClickScaleReset: () => void
  setPlayerPosition: (tick: number) => void
  previewNote: (event: any, channel: number) => void
}

export const PianoRoll: StatelessComponent<PianoRollProps> = ({
  dispatch,
  mouseHandler,
  theme,
  track,
  events,
  transform,
  beats,
  endTick,
  mouseMode,
  selection,
  alphaHeight,
  scrollLeft,
  scrollTop,
  setScrollLeft,
  setScrollTop,
  controlMode,
  setControlMode,
  notesCursor,
  cursorPosition,
  onMountAlpha,
  loop,
  setLoopBegin,
  setLoopEnd,
  size,
  onClickScaleUp,
  onClickScaleDown,
  onClickScaleReset,
  setPlayerPosition,
  previewNote
}) => {
  const { keyWidth, rulerHeight } = theme

  const containerWidth = size.width

  const width = containerWidth
  const widthTick = Math.max(endTick, transform.getTicks(containerWidth))
  const startTick = scrollLeft / transform.pixelsPerTick
  const mappedBeats = mapBeats(
    beats,
    transform.pixelsPerTick,
    startTick,
    widthTick
  )

  const contentWidth = widthTick * transform.pixelsPerTick
  const contentHeight = transform.getMaxY()

  const cursorPositionX = transform.getX(cursorPosition)

  function clampScroll(maxOffset: number, scroll: number) {
    return Math.floor(Math.min(maxOffset, Math.max(0, scroll)))
  }

  scrollLeft = clampScroll(contentWidth - containerWidth, scrollLeft)
  scrollTop = clampScroll(contentHeight - alphaHeight, scrollTop)

  const onMouseDownRuler = (e: any) => {
    const tick = e.tick
    if (e.ctrlKey) {
      setLoopBegin(tick)
    } else if (e.altKey) {
      setLoopEnd(tick)
    } else {
      setPlayerPosition(tick)
    }
  }

  const onDoubleClickMark = (event: any, group: DisplayEvent[]) => {
    showEventEditor(group)
  }

  return (
    <div className="PianoRoll">
      <SplitPane split="horizontal" defaultSize={180} primary="second">
        <div
          className="alpha"
          ref={onMountAlpha}
          onWheel={e => {
            e.preventDefault()
            const scrollLineHeight = transform.pixelsPerKey * SCROLL_KEY_SPEED
            const delta = scrollLineHeight * (e.deltaY > 0 ? 1 : -1)
            setScrollTop(scrollTop + delta)
          }}
        >
          <div className="alphaContent" style={{ top: -scrollTop }}>
            <PianoLines
              theme={theme}
              width={width}
              pixelsPerKey={transform.pixelsPerKey}
              numberOfKeys={transform.numberOfKeys}
            />
            <PianoGrid
              theme={theme}
              width={width}
              height={contentHeight}
              scrollLeft={scrollLeft}
              beats={mappedBeats}
            />
            <PianoNotes
              events={events}
              selectedEventIds={selection.noteIds}
              transform={transform}
              width={width}
              cursor={notesCursor}
              scrollLeft={scrollLeft}
              isDrumMode={track.isRhythmTrack}
              onMouseDown={(e: any) => mouseHandler.onMouseDown(e)}
              onMouseMove={(e: any) => mouseHandler.onMouseMove(e)}
              onMouseUp={(e: any) => mouseHandler.onMouseUp(e)}
              theme={theme}
            />
            <PianoSelection
              color={theme.themeColor}
              width={width}
              height={contentHeight}
              selectionBounds={
                selection.enabled ? selection.getBounds(transform) : null
              }
              scrollLeft={scrollLeft}
            />
            <PianoCursor
              width={width}
              height={contentHeight}
              position={cursorPositionX - scrollLeft}
            />
            <PianoKeys
              theme={theme}
              width={keyWidth}
              keyHeight={transform.pixelsPerKey}
              numberOfKeys={transform.numberOfKeys}
              onClickKey={noteNumber => previewNote(noteNumber, track.channel)}
            />
          </div>
          <div className="alphaRuler">
            <PianoRuler
              width={width}
              theme={theme}
              height={rulerHeight}
              beats={mappedBeats}
              loop={loop}
              onMouseDown={onMouseDownRuler}
              scrollLeft={scrollLeft}
              pixelsPerTick={transform.pixelsPerTick}
            />
            <div className="PianoRollLeftSpace" />
            <PianoControlEvents
              events={events}
              width={width}
              scrollLeft={scrollLeft}
              pixelsPerTick={transform.pixelsPerTick}
              onDoubleClickMark={onDoubleClickMark}
            />
          </div>
          <VerticalScrollBar
            scrollOffset={scrollTop}
            contentLength={contentHeight}
            onScroll={(scroll: number) => setScrollTop(scroll)}
          />
        </div>
        <div className="beta">
          <ControlPane
            mode={controlMode}
            theme={theme}
            beats={mappedBeats}
            events={events}
            dispatch={dispatch}
            transform={transform}
            scrollLeft={scrollLeft}
            paddingBottom={BAR_WIDTH}
            onSelectTab={setControlMode}
          />
        </div>
      </SplitPane>
      <HorizontalScaleScrollBar
        scrollOffset={scrollLeft}
        contentLength={contentWidth}
        onScroll={(scroll: number) => setScrollLeft(scroll)}
        onClickScaleUp={onClickScaleUp}
        onClickScaleDown={onClickScaleDown}
        onClickScaleReset={onClickScaleReset}
      />
    </div>
  )
}