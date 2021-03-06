import { Graphics } from "@inlet/react-pixi"
import isEqual from "lodash/isEqual"
import { Graphics as PIXIGraphics, Rectangle } from "pixi.js"
import React, { FC } from "react"
import { IRect } from "../../../../common/geometry"

export type PianoNoteItem = IRect & {
  id: number
  velocity: number
  isSelected: boolean
  isDrum: boolean
}

export interface PianoNoteProps {
  item: PianoNoteItem
  color: number
  borderColor: number
  selectedColor: number
  selectedBorderColor: number
}

export type MousePositionType = "left" | "center" | "right"

export const mousePositionToCursor = (position: MousePositionType) => {
  switch (position) {
    case "center":
      return "move"
    case "left":
      return "w-resize"
    case "right":
      return "e-resize"
  }
}

// fake class that is only used to refer additional property information for Graphics
class PianoGraphics extends PIXIGraphics {
  item: PianoNoteItem
}

export const isPianoNote = (x: PIXI.DisplayObject | null): x is PianoGraphics =>
  x?.name === "PianoNote"

const _PianoNote: FC<PianoNoteProps> = (props) => {
  const { item } = props

  const render = (g: PIXIGraphics) => {
    const alpha = item.velocity / 127
    const noteColor = item.isSelected ? props.selectedColor : props.color
    let { width, height } = item

    width = Math.round(width) - 1
    height = Math.round(height) - 1
    const lineColor = item.isSelected
      ? props.selectedBorderColor
      : props.borderColor

    g.clear()
      .lineStyle(1, lineColor, alpha)
      .beginFill(noteColor, alpha)
      .drawRect(0, 0, width, height)
      .endFill()
  }

  const renderDrumNote = (g: PIXIGraphics) => {
    const alpha = item.velocity / 127
    const noteColor = item.isSelected ? props.selectedColor : props.color
    const radius = Math.round(item.height / 2)

    g.clear()
      .lineStyle(1, props.borderColor, 1)
      .beginFill(noteColor, alpha)
      .drawCircle(0, Math.round(radius / 2) + 1, radius)
  }

  const data = {
    item,
  }

  return (
    <Graphics
      name="PianoNote"
      draw={item.isDrum ? renderDrumNote : render}
      x={Math.round(item.x)}
      y={Math.round(item.y)}
      interactive={true}
      hitArea={
        item.isDrum
          ? new Rectangle(
              -item.height / 2,
              -item.height / 2,
              item.height,
              item.height
            )
          : new Rectangle(0, 0, item.width, item.height)
      }
      {...data}
    />
  )
}

export const getPositionType = (
  localX: number,
  width: number,
  isDrum: boolean
): MousePositionType => {
  if (isDrum) {
    return "center"
  }
  const edgeSize = Math.min(width / 3, 8)
  if (localX <= edgeSize) {
    return "left"
  }
  if (width - localX <= edgeSize) {
    return "right"
  }
  return "center"
}

const areEqual = (props: PianoNoteProps, nextProps: PianoNoteProps) =>
  isEqual(props.item, nextProps.item) &&
  props.color === nextProps.color &&
  props.borderColor === nextProps.borderColor &&
  props.selectedColor === nextProps.selectedColor &&
  props.selectedBorderColor === nextProps.selectedBorderColor

export const PianoNote = React.memo(_PianoNote, areEqual)
