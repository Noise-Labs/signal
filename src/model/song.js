class Song {
  constructor() {
    this.tracks = []
    riot.observable(this)
  }

  addTrack(t) {
    this.tracks.push(t)
    this.trigger("add-track", t)
    this.trigger("change")
  }

  getTracks() {
    return this.tracks
  }

  getTrack(id) {
    return this.tracks[id]
  }

  static emptySong() {
    const song = new Song()
    song.addTrack(new Track())
    return song
  }

  static fromMidi(midi) {
    const song = new Song
    midi.tracks.forEach(t => {
      const track = new Track
      t.events.forEach(e => {
        track.addEvent(e)
      })
      track.name = t.name
      track.endOfTrack = t.end
      song.addTrack(track)
    })
    return song
  }
}

class Track {
  constructor() {
    this.events = []
    this.lastEventId = 0
    riot.observable(this)
  }

  getName() {
    return this.name
  }

  getEndOfTrack() {
    return this.endOfTrack
  }

  getEvents() {
    return this.events
  }

  getEventById(id) {
    for (const e of this.events) {
      if (e.id == id) {
        return e
      }
    }
    return null
  }

  updateEvent(id, obj) {
    const anObj = this.getEventById(id)
    _.extend(anObj, obj)
    this.emitChange()
  }

  removeEvent(id) {
    const obj = this.getEventById(id)
    this.events.remove(obj)
    this.emitChange()
  }

  addEvent(e) {
    e.id = this.lastEventId
    this.events.push(e)
    this.lastEventId++
    this.emitChange()
  }

  transaction(func) {
    this._paused = true
    func(this)
    this._paused = false
    this.emitChange()
  }

  emitChange() {
    if (!this._paused) { 
      this.trigger("change")
    }
  }
}