import { api } from '../../../shared/services/api';
import type { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload } from '../types/appointment.types';

export const appointmentService = {
  async getAppointments(dossierId?: string): Promise<Appointment[]> {
    const params = dossierId ? { dossier: dossierId } : {};
    const { data } = await api.get('/rendez-vous/', { params });
    return Array.isArray(data) ? data : (data as any).results || [];
  },

  async getAppointment(appointmentId: string): Promise<Appointment> {
    const { data } = await api.get(`/rendez-vous/${appointmentId}/`);
    return data;
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    const { data } = await api.post('/rendez-vous/', payload);
    return data;
  },

  async updateAppointment(appointmentId: string, payload: UpdateAppointmentPayload): Promise<Appointment> {
    const { data } = await api.patch(`/rendez-vous/${appointmentId}/`, payload);
    return data;
  },

  async deleteAppointment(appointmentId: string): Promise<void> {
    await api.delete(`/rendez-vous/${appointmentId}/`);
  },

  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointment(appointmentId, { statut: 'confirme' });
  },

  async requestReschedule(appointmentId: string): Promise<Appointment> {
    return this.updateAppointment(appointmentId, { statut: 'reporte' });
  },

  async cancelAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointment(appointmentId, { statut: 'annule' });
  },

  async completeAppointment(appointmentId: string): Promise<Appointment> {
    return this.updateAppointment(appointmentId, { statut: 'termine' });
  },
};