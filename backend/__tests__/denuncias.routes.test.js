// Pruebas de integración de la API de denuncias
// Usa supertest contra la app Express y Mongo en memoria
import request from 'supertest';
import app from '../src/app.js';

describe('Denuncias API', () => {
  test('POST /api/denuncias crea denuncia con archivo y campos mínimos', async () => {
    const fileBuffer = Buffer.from('%PDF-1.4 test');
    const res = await request(app)
      .post('/api/denuncias')
      .field('empresaRut', '76.543.210-9')
      .field('motivo', 'Acoso laboral')
      .field('detalle', 'Detalle de la denuncia')
      .field('fechaOPeriodo', '2025-10-23')
      .attach('evidencias', fileBuffer, { filename: 'prueba.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('empresaRut', '76.543.210-9');
    expect(res.body).toHaveProperty('motivo', 'Acoso laboral');
    expect(Array.isArray(res.body.evidencias)).toBe(true);
    expect(res.body.evidencias.length).toBe(1);
    expect(res.body.evidencias[0]).toMatchObject({ originalname: 'prueba.pdf' });
  });

  test('POST /api/denuncias valida campos requeridos', async () => {
    const res = await request(app)
      .post('/api/denuncias')
      .field('detalle', 'Falta motivo y empresa');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
  });
});
