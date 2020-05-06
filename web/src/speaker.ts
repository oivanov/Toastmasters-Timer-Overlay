import { TimingSelector, getOption } from './timingSelector'
import { ISpeakerInput } from './types'
import { createElement, fixTime, passStr, passStrNum, getElementByID } from './util'
import params from './params'

const isView = typeof params.view != 'undefined'

export class Speaker {
    id: number
    el: HTMLElement
    timeNode: Text
    nameNode: Text | HTMLInputElement
    presetNode: Text | TimingSelector
    presetValue: string
    constructor({ name, time, preset, id }: ISpeakerInput) {
        this.id = id
        const speaker = createElement('div', { className: 'speaker' })
        const speakerTop = createElement('div', { className: 'speaker-top' })
        const speakerTime = createElement('div', { className: 'speaker-time' })
        const speakerName = createElement('div', { className: 'speaker-name' })
        const speakerPreset = createElement('div', { className: 'speaker-preset' })
        const timeText = document.createTextNode(fixTime(time, ''))
        let nameInput: HTMLInputElement | Text
        let presetInput: TimingSelector | Text

        if (isView) {
            nameInput = document.createTextNode(name ?? '')
            const opt = getOption(preset ?? 0, true)
            this.presetValue = opt.value
            presetInput = document.createTextNode(opt.text)
            speakerPreset.append(presetInput)
        } else {
            nameInput = createElement('input')
            nameInput.value = name ?? ''
            presetInput = new TimingSelector(speakerPreset)
            this.presetValue = presetInput.get()
            presetInput.set(preset ?? 0)
        }
        speakerName.append(nameInput)
        speakerTime.append(timeText)
        speakerTop.append(speakerName, speakerTime)
        speaker.append(speakerTop, speakerPreset)

        this.el = speaker
        this.timeNode = timeText
        this.nameNode = nameInput
        this.presetNode = presetInput
    }

    get time() {
        return this.timeNode.data
    }

    set time(val) {
        this.timeNode.data = val
    }

    get name() {
        if (this.nameNode instanceof Text) {
            return this.nameNode.data
        } else {
            return this.nameNode.value
        }
    }

    set name(val) {
        if (this.nameNode instanceof Text) {
            this.nameNode.data = val
        } else {
            this.nameNode.value = val
        }
    }

    get preset() {
        if (this.presetNode instanceof Text) {
            return this.presetValue
        } else {
            return this.presetNode.get()
        }
    }

    set preset(val) {
        if (this.presetNode instanceof Text) {
            const opt = getOption(val, true)
            this.presetValue = opt.value
            this.presetNode.data = opt.text
        } else {
            this.presetNode.set(val)
            this.presetValue = this.presetNode.get()
        }
    }

}

export class SpeakerGroup {
    speakers: { [id: number]: Speaker } = {}
    speakerObjects: ISpeakerInput[] = []
    container: HTMLDivElement

    constructor(container: string | HTMLDivElement, speakers?: ISpeakerInput[]) {
        this.container = typeof container === 'string' ? getElementByID(container, 'div') : container

        this.addMany(speakers)
    }

    private _add(speakerArr: ISpeakerInput[], append = true) {
        for (let i = 0; i < speakerArr.length; i++) {
            const speakerObj = speakerArr[i]
            const id = speakerObj.id

            if (typeof this.speakers[id] === 'undefined') {
                const speaker = new Speaker(speakerArr[i])
                this.speakers[id] = speaker
                this.speakerObjects.push(speakerObj)
                if (append) this.container.append(speaker.el)
            } else {
                console.warn(`Speaker id ${id} already exists`)
            }

        }
    }

    addOne(speakers: ISpeakerInput, position = -1) {

    }

    addMany(speakers?: ISpeakerInput[]) {
        this._add(cleanSpeakerArr(speakers))
    }

    updateAll(speakers: ISpeakerInput[] | ISpeakerInput) {
        const cleaned = cleanSpeakerArr(speakers)
        const { remove, add, move, change } = diffSpeakers(this.speakerObjects, cleaned)

        this.remove(remove)

        if (add.length > 0) {
            this._add(add, move == null)
        }

        if (move != null) {
            this.rearrange(move)
        }

        for (let i = 0; i < change.length; i++) {
            const { id, change: changeData } = change[i]
            if(typeof this.speakers[id] === 'undefined') continue

            
        }
    }

    move(id: number, shift: number) {

    }

    rearrange(ids: number[]) {

    }

    remove(id: number | number[]) {
        if (Array.isArray(id)) {
            for (let i = 0; i < id.length; i++) {
                const speakerId = id[i]
                if (typeof this.speakers[speakerId] == 'undefined') continue
                const speaker = this.speakers[speakerId]
                this.container.removeChild(speaker.el)
                delete this.speakers[speakerId]
            }
        } else if (typeof this.speakers[id] != 'undefined') {
            this.container.removeChild(this.speakers[id].el)
            delete this.speakers[id]
        }
    }
    removeAt(index: number) {

    }
    removeAll() {

    }
}

export function createSpeaker() {
    const id = Math.round(Math.random() * 0xffff)
    return new Speaker({ id })
}
function cleanSpeaker(obj: any): ISpeakerInput | undefined {
    if (obj != null && typeof obj === 'object' && typeof obj.id === 'number') {
        const { id, name, time, preset } = obj
        return { id, name: passStr(name), time: passStrNum(time), preset: passStrNum(preset) }
    }
}
function cleanSpeakerArr(obj: any): ISpeakerInput[] {
    if (obj == null) {
        return []
    } else if (Array.isArray(obj)) {
        const res: ISpeakerInput[] = []
        for (let i = 0; i < obj.length; i++) {
            const cleanObj = cleanSpeaker(obj[i])
            if (cleanObj != null) {
                res.push(cleanObj)
            }
        }
        return res
    } else if (typeof obj == 'object') {
        const cleanObj = cleanSpeaker(obj)
        if (cleanObj == null) {
            return []
        } else {
            return [cleanObj]
        }
    }
    return []
}

function diffSpeakers(original: ISpeakerInput[], secondary: ISpeakerInput[]): IDiff {
    const change: IChange[] = [],
        remove: number[] = [],
        add: ISpeakerInput[] = [],
        originalChangedIds: number[] = [],
        originalChangedSpeakers: ISpeakerInput[] = [],
        secondaryIds = secondary.map(a => a.id)

    for (let index = 0; index < original.length; index++) {
        const speaker = original[index]
        const id = speaker.id

        if (!secondaryIds.includes(id)) {
            remove.push(id)
        } else {
            originalChangedIds.push(id)
            originalChangedSpeakers.push(speaker)
        }
    }

    let hasMoved = false

    for (let index = 0; index < secondaryIds.length; index++) {
        const id = secondaryIds[index]
        const originalIndex = originalChangedIds.indexOf(id)

        if (originalIndex < 0) {
            add.push(secondary[index])
        } else {
            const originalSpeaker = originalChangedSpeakers[originalIndex]
            const secondarySpeaker = secondary[index]
            const changeData: IChange = { id, change: {} }
            let addedChange = false

            if (originalSpeaker.name != secondarySpeaker.name) {
                changeData.change.name = secondarySpeaker.name
                addedChange = true
            }
            if (originalSpeaker.preset != secondarySpeaker.preset) {
                changeData.change.preset = secondarySpeaker.preset
                addedChange = true
            }
            if (originalSpeaker.time != secondarySpeaker.time) {
                changeData.change.time = secondarySpeaker.time
                addedChange = true
            }

            if (addedChange) {
                change.push(changeData)
            }
        }

        if (originalIndex !== index) {
            hasMoved = true
        }

    }

    const res: IDiff = { change, remove, add }

    if (hasMoved) {
        res.move = secondaryIds
    }

    return res
}

interface IChange {
    id: number
    change: Pick<ISpeakerInput, Exclude<keyof ISpeakerInput, 'id'>>
}

interface IDiff {
    change: IChange[]
    remove: number[]
    add: ISpeakerInput[]
    move?: number[]
}