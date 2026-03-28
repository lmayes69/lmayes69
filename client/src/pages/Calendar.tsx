import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { calendarApi } from '../lib/api';
import type { CalendarEvent } from '../types';
import { GOOGLE_COLOR_MAP } from '../types';
import { format } from 'date-fns';

interface AddEventForm {
  summary: string;
  description: string;
  start: string;
  end: string;
  colorId: string;
}

const defaultForm: AddEventForm = {
  summary: '',
  description: '',
  start: '',
  end: '',
  colorId: '1',
};

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<EventInput[]>([]);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<AddEventForm>(defaultForm);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const loadEvents = async (start?: string, end?: string) => {
    try {
      setLoading(true);
      const data = await calendarApi.getEvents({ timeMin: start, timeMax: end });
      setConnected(data.connected);
      setMessage(data.message || '');
      const formatted = data.events.map((e: CalendarEvent) => ({
        id: e.id,
        title: e.summary,
        start: e.start.dateTime || e.start.date,
        end: e.end.dateTime || e.end.date,
        backgroundColor: e.colorId ? GOOGLE_COLOR_MAP[e.colorId] || '#4F46E5' : '#4F46E5',
        borderColor: 'transparent',
        extendedProps: {
          description: e.description,
          isSample: e.isSample,
        },
      }));
      setEvents(formatted);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const startStr = selectInfo.startStr.includes('T')
      ? selectInfo.startStr.slice(0, 16)
      : selectInfo.startStr + 'T09:00';
    const endStr = selectInfo.endStr.includes('T')
      ? selectInfo.endStr.slice(0, 16)
      : selectInfo.startStr + 'T10:00';

    setForm({ ...defaultForm, start: startStr, end: endStr });
    setShowAddModal(true);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent({
      title: clickInfo.event.title,
      start: clickInfo.event.start,
      end: clickInfo.event.end,
      description: clickInfo.event.extendedProps.description,
      isSample: clickInfo.event.extendedProps.isSample,
    });
  };

  const handleAddEvent = async () => {
    if (!form.summary || !form.start || !form.end) return;
    if (!connected) {
      alert('Please connect Google Calendar in Settings first.');
      return;
    }

    setSaving(true);
    try {
      const startHasTime = form.start.includes('T');
      const endHasTime = form.end.includes('T');

      await calendarApi.createEvent({
        summary: form.summary,
        description: form.description,
        start: startHasTime
          ? { dateTime: new Date(form.start).toISOString() }
          : { date: form.start },
        end: endHasTime
          ? { dateTime: new Date(form.end).toISOString() }
          : { date: form.end },
        colorId: form.colorId,
      });

      setShowAddModal(false);
      setForm(defaultForm);
      await loadEvents();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📅 Family Calendar</h1>
        <div className="flex items-center gap-3">
          {!connected && (
            <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              ⚠️ Showing sample events
            </span>
          )}
          {connected && (
            <span className="text-sm text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
              ✅ Google Calendar connected
            </span>
          )}
          <button
            onClick={() => { setForm(defaultForm); setShowAddModal(true); }}
            className="btn-primary"
          >
            + Add Event
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          ℹ️ {message}
        </div>
      )}

      <div className="card">
        {loading && (
          <div className="flex items-center justify-center h-16 mb-4">
            <div className="text-gray-400 text-sm">Loading events...</div>
          </div>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          events={events}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          height="auto"
          datesSet={(info) => {
            loadEvents(info.startStr, info.endStr);
          }}
          eventDisplay="block"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Calendar Event</h2>
            </div>
            <div className="p-6 space-y-4">
              {!connected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  ⚠️ Connect Google Calendar in Settings to save events.
                </div>
              )}

              <div>
                <label className="label">Event Title *</label>
                <input
                  type="text"
                  value={form.summary}
                  onChange={e => setForm({ ...form, summary: e.target.value })}
                  className="input"
                  placeholder="e.g. Soccer Practice"
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Optional details..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start *</label>
                  <input
                    type="datetime-local"
                    value={form.start}
                    onChange={e => setForm({ ...form, start: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End *</label>
                  <input
                    type="datetime-local"
                    value={form.end}
                    onChange={e => setForm({ ...form, end: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(GOOGLE_COLOR_MAP).map(([id, color]) => (
                    <button
                      key={id}
                      onClick={() => setForm({ ...form, colorId: id })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        form.colorId === id ? 'scale-125 border-gray-800' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={saving || !form.summary || !form.start || !form.end}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedEvent.title}</h2>
              {selectedEvent.start && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span>📅</span>
                  <span>
                    {format(new Date(selectedEvent.start), 'EEEE, MMM d')}
                    {selectedEvent.start.getHours() !== 0 && (
                      ` at ${format(new Date(selectedEvent.start), 'h:mm a')}`
                    )}
                  </span>
                </div>
              )}
              {selectedEvent.description && (
                <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                  {selectedEvent.description}
                </p>
              )}
              {selectedEvent.isSample && (
                <p className="text-xs text-amber-600 mt-3">
                  This is a sample event. Connect Google Calendar to see real events.
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
