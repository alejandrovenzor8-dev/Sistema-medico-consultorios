# 🏥 MediConsult – Sistema de Administración para Consultorios Médicos

Sistema web modular para consultorios médicos independientes (dentistas, fisioterapeutas, nutriólogos, etc.) que permite gestionar pacientes, citas, historial clínico y finanzas.

## ✅ Módulos Implementados (MVP)

| Módulo | Descripción |
|--------|-------------|
| **Autenticación** | JWT + roles (admin, doctor, recepcionista) |
| **Gestión de Pacientes** | CRUD completo con búsqueda, historial y contacto de emergencia |
| **Agenda y Citas** | Calendario semanal, crear/confirmar/cancelar citas |
| **Historial Clínico** | Registros por visita con signos vitales, diagnóstico, recetas |
| **Finanzas** | Pagos, métodos de pago, facturación automática, reporte gráfico mensual |
| **Dashboard** | Estadísticas en tiempo real: pacientes, citas hoy, ingresos del mes |

## 🛠️ Tecnologías

- **Frontend**: React 18 + TailwindCSS + Recharts
- **Backend**: Node.js + Express + JWT
- **Base de datos**: PostgreSQL + Sequelize ORM
- **Autenticación**: JWT + roles por usuario
- **Contenedores**: Docker + Docker Compose

## 📁 Estructura del Proyecto

```
Sistema-medico-consultorios/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuración de BD
│   │   ├── models/         # User, Patient, Appointment, ClinicalRecord, Payment
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Endpoints REST
│   │   ├── middleware/      # Autenticación y autorización
│   │   └── tests/          # Tests con Jest + Supertest
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/        # AuthContext (JWT)
│   │   ├── services/       # Cliente Axios
│   │   ├── components/     # Layout, Sidebar, Header
│   │   └── pages/          # Dashboard, Patients, Appointments, ClinicalHistory, Finance
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Inicio Rápido

### Opción 1: Docker Compose (recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/alejandrovenzor8-dev/Sistema-medico-consultorios.git
cd Sistema-medico-consultorios

# Iniciar todos los servicios (PostgreSQL + Backend + Frontend)
docker compose up -d

# La aplicación estará disponible en:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
```

### Opción 2: Desarrollo local

#### Prerrequisitos
- Node.js 18+
- PostgreSQL 15+

#### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus datos de PostgreSQL
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 🔐 API Endpoints

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/auth/profile` | Perfil actual |

### Pacientes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/patients` | Listar pacientes (paginado, búsqueda) |
| POST | `/api/patients` | Crear paciente |
| GET | `/api/patients/:id` | Detalle de paciente |
| PUT | `/api/patients/:id` | Actualizar paciente |
| DELETE | `/api/patients/:id` | Desactivar paciente |
| GET | `/api/patients/:id/history` | Historial clínico del paciente |

### Citas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/appointments` | Listar citas (filtros: fecha, doctor, estado) |
| GET | `/api/appointments/today` | Citas de hoy |
| POST | `/api/appointments` | Crear cita |
| PUT | `/api/appointments/:id` | Actualizar cita |
| PATCH | `/api/appointments/:id/cancel` | Cancelar cita |

### Historial Clínico
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/clinical` | Listar registros |
| POST | `/api/clinical` | Crear registro (rol: admin/doctor) |
| PUT | `/api/clinical/:id` | Actualizar registro |

### Finanzas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/payments` | Listar pagos (paginado) |
| POST | `/api/payments` | Registrar pago |
| GET | `/api/payments/summary` | Resumen mensual/anual |
| GET | `/api/payments/report/monthly` | Reporte mensual para gráfica |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Estadísticas generales |

### Asistente IA (solo rol `doctor`)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/assistant/query` | Consulta en lenguaje natural (medicamentos, historial, insights) |

## 🧪 Tests

```bash
cd backend
npm test
```

## 🔒 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso completo |
| `doctor` | Pacientes, citas, historial clínico, pagos |
| `receptionist` | Pacientes, citas, pagos |
| `patient` | Solo lectura de su propio expediente |

## 📄 Variables de Entorno

Copiar `backend/.env.example` a `backend/.env` y configurar:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_medico
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
IA_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Azure OpenAI (opcional)
# IA_PROVIDER=azure
# AZURE_OPENAI_API_KEY=
# AZURE_OPENAI_ENDPOINT=
# AZURE_OPENAI_DEPLOYMENT=
# AZURE_OPENAI_API_VERSION=2024-02-15-preview
```
