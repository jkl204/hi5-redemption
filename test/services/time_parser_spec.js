import expect from 'expect'
import moment from 'moment'

import { openToday, openNow, todaysHours, fullHours } from 'src/services/time_parser'

describe('services/time_parser', () => {
  describe('#fullHours', () => {
    const DATE_STRING = 'Mon-Sun 08:00-17:00'

    it('expands the days', () => {
      expect(fullHours(DATE_STRING)).toContain('Monday - Sunday')
    })

    it('formats the hours to AM/PM', () => {
      expect(fullHours(DATE_STRING)).toContain('8:00 am - 5:00 pm')
    })

    describe('merging two hours', () => {
      const DATE_STRING = 'Mon,Tue,Wed,Sun 08:00-12:00; Mon,Tue,Wed,Sun 13:30-17:00'

      it('only inserts the days once', () => {
        const hours = fullHours(DATE_STRING)
        const matches = hours.match(/Monday, Tuesday, Wednesday, Sunday/g)
        expect(matches.length).toEqual(1)
      })

      it('joins the hours', () => {
        const hours = fullHours(DATE_STRING)
        expect(hours).toContain('8:00 am - 12:00 pm and from 1:30 pm - 5:00 pm')
      })
    })
  })

  describe('#openToday', () => {
    describe('ranged dates', () => {
      describe('normal range', () => {
        const DATE_STRING = 'Mon-Sat 08:00-17:00'

        it('is open at the beginning of the range', () => {
          const date = moment().day(1).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('is open in the middle of the range', () => {
          const date = moment().day(3).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('is open at the end of the range', () => {
          const date = moment().day(6).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('is not open if the day is not specified', () => {
          const date = moment().day(0).toDate()
          expect(openToday(DATE_STRING, date)).toBe(false)
        })
      })

      describe('ranges that end on Sunday', () => {
        const DATE_STRING = 'Wed-Sun 08:00-17:00'

        it('is open at the beginning of the range', () => {
          const date = moment().day(3).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('is open in the middle of the range', () => {
          const date = moment().day(4).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('is open at the end of the range', () => {
          const date = moment().day(0).toDate()
          expect(openToday(DATE_STRING, date)).toBe(true)
        })

        it('handles a complete range', () => {
          const date = moment().day(0).toDate()
          const dateString = DATE_STRING.replace(/Wed-Sun/, 'Mon-Sun')
          expect(openToday(dateString, date)).toBe(true)
        })
      })
    })

    describe('comma-delimited days', () => {
      const DATE_STRING = 'Wed,Fri,Sat,Sun 08:00-15:30'

      it('is open for one of the specified days', () => {
        const date = moment().day(6).toDate()
        expect(openToday(DATE_STRING, date)).toBe(true)
      })

      it('is closed for one of the unspecified days', () => {
        const date = moment().day(1).toDate()
        expect(openToday(DATE_STRING, date)).toBe(false)
      })
    })

    describe('combined', () => {
      const DATE_STRING = 'Mon-Wed 08:00-15:30; Sat 08:00-15:30'

      it('is open for one of the days in the range', () => {
        const date = moment().day(1).toDate()
        expect(openToday(DATE_STRING, date)).toBe(true)
      })

      it('is open for one of the specified days', () => {
        const date = moment().day(6).toDate()
        expect(openToday(DATE_STRING, date)).toBe(true)
      })

      it('is closed for a day not specified', () => {
        const date = moment().day(0).toDate()
        expect(openToday(DATE_STRING, date)).toBe(false)
      })
    })
  })

  describe('#openNow', () => {
    const DATE_STRING = 'Mon-Wed 08:00-15:30; Sat 08:00-12:30'

    it('is false if the location is not open today', () => {
      const date = moment().day(0).toDate()
      expect(openNow(DATE_STRING, date)).toBe(false)
    })

    it('is open at the beginning of the range', () => {
      const date = moment().day(1).hour(8).minutes(0).toDate()
      expect(openNow(DATE_STRING, date)).toBe(true)
    })

    it('is closed at the end of the range', () => {
      const date = moment().day(1).hour(15).minutes(30).toDate()
      expect(openNow(DATE_STRING, date)).toBe(false)
    })

    it('is open in the middle of the range', () => {
      const date = moment().day(1).hour(12).minutes(30).toDate()
      expect(openNow(DATE_STRING, date)).toBe(true)
    })

    it('is closed outside of the range', () => {
      const date = moment().day(1).hour(7).minutes(30).toDate()
      expect(openNow(DATE_STRING, date)).toBe(false)
    })

    it('is open at the beginning of the second range', () => {
      const date = moment().day(6).hour(8).minutes(0).toDate()
      expect(openNow(DATE_STRING, date)).toBe(true)
    })

    it('is closed at the end of the second range', () => {
      const date = moment().day(6).hour(12).minutes(30).toDate()
      expect(openNow(DATE_STRING, date)).toBe(false)
    })
  })

  describe('#todaysHours', () => {
    const DATE_STRING = 'Mon-Wed 08:00-15:30; Sat 08:00-12:30'

    it('returns closed if the location is closed today', () => {
      const date = moment().day(0)
      expect(todaysHours(DATE_STRING, date)).toContain('Closed')
    })

    it('displays "Open" if the location is open today', () => {
      const date = moment().day(1)
      expect(todaysHours(DATE_STRING, date)).toContain('Open')
    })

    it('contains a formatted open time', () => {
      const date = moment().day(1)
      expect(todaysHours(DATE_STRING, date)).toContain('8:00 am')
    })

    it('contains a formatted closed time', () => {
      const date = moment().day(1)
      expect(todaysHours(DATE_STRING, date)).toContain('3:30 pm')
    })

    it('joins multiple hours', () => {
      const DATE_STRING = 'Mon,Tue,Wed,Sun 08:00-12:00; Mon,Tue,Wed,Sun 13:30-17:00'
      const date = moment().day(1)
      const hours = todaysHours(DATE_STRING, date)
      expect(hours).toContain('8:00 am - 12:00 pm, 1:30 pm - 5:00 pm')
    })
  })
})
