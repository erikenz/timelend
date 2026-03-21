# Frontend Tasks - TimeLend (Actualizado)

Fecha: 2026-03-21

## ✅ Tareas completadas en esta iteración

### P0 - Entorno y configuración
- [x] Corregido script de desarrollo en `apps/web/package.json` (`dev.` → `dev`).
- [x] Corregido script de lint para Next 16 (se reemplazó por `pnpm dlx ultracite check`).
- [x] Agregado `turbopack.root` en `apps/web/next.config.js`.
- [x] Instaladas dependencias del workspace para que `apps/web` resuelva tipos correctamente.

### P0/P1 - Navegación y Home
- [x] Navbar con estado activo por ruta (`Home`, `Create`, `Dashboard`).
- [x] Navbar responsive con menú móvil real.
- [x] Accesibilidad del menú móvil: `aria-expanded`, `aria-controls`, cierre con `Esc`, foco inicial al abrir.
- [x] Botón de wallet sin `console.log` y con estados visuales (`Conectar`, `Conectando...`, `Conectado`).
- [x] CTA principal de Home conectado a flujo real (`/create`).
- [x] Secciones informativas mínimas agregadas en Home.

### P0 - Crear compromiso funcional
- [x] Validación robusta en `CreateForm`:
  - [x] `description` mínimo 10 caracteres.
  - [x] `amount` > 0.
  - [x] `deadline` con formato válido y fecha hoy/futura.
- [x] Mensajes de error por campo con `aria-live`.
- [x] Estado de envío (`Creando...`, botón deshabilitado).
- [x] Integración con API real local (`POST /api/commitments`).
- [x] Reset del formulario solo en éxito.
- [x] Redirección a `/dashboard` tras creación exitosa.

### P0 - Dashboard funcional
- [x] Reemplazados datos hardcodeados por fetch real (`GET /api/commitments`).
- [x] Estados de datos implementados: `loading` (skeleton), `error`, `empty`.
- [x] Filtros y orden implementados (estado y fecha límite).
- [x] Formato de fechas y montos por locale (`es-ES`).

### SEO base
- [x] Metadata base mejorada en `layout.tsx` (title template + Open Graph básico).
- [x] Metadata por página en `app/page.tsx`, `app/create/page.tsx`, `app/dashboard/page.tsx`.

---

## ⚠️ Hallazgos técnicos actuales

- [ ] El check completo de Ultracite en `apps/web` aún falla por reglas preexistentes de convención de nombres de archivos (`PascalCase` en `components/*`) y algunos archivos legacy no tocados en esta iteración.
- [x] `pnpm --filter web check-types` pasa en verde.

---

## 🚀 Nuevo backlog propuesto (qué agregar)

## 1) Persistencia real y modelo de datos
- [ ] Sustituir almacenamiento en memoria de `app/api/commitments/route.ts` por persistencia real (DB o API del backend `apps/api`).
- [ ] Añadir endpoint `PATCH /api/commitments/:id` para acciones por tarjeta (`completed`, edición).
- [ ] Añadir endpoint `GET /api/commitments/:id` para vista de detalle.

## 2) Integración Web3 completa
- [ ] Implementar conexión real de wallet con `wagmi` + conector (injected, WalletConnect).
- [ ] Proteger rutas `/create` y `/dashboard` por estado de wallet/conexión.
- [ ] Integrar `useWriteContract` en creación y mapear estado de transacción (`pendiente`, `éxito`, `error`).
- [ ] Convertir `amount` a Wei (`BigInt`) con utilidades de `viem`.

## 3) Dashboard avanzado
- [ ] Agregar acciones por tarjeta: ver detalle, editar, marcar completado.
- [ ] Agregar paginación o carga incremental.
- [ ] Agregar buscador por descripción.

## 4) UX y accesibilidad
- [ ] Añadir notificaciones toast para éxito/error global (ej. `sonner`).
- [ ] Mejorar contraste de badges para WCAG AA.
- [ ] Añadir `aria-live` global para resultados de creación y refresh de dashboard.
- [ ] Mejorar estados `hover/focus/disabled/loading` de todos los controles restantes.

## 5) Calidad y testing
- [ ] Tests unitarios de `CreateForm` (validación + submit).
- [ ] Tests de `Navbar` (estado activo, menú móvil, cierre con `Esc`).
- [ ] Tests de `DashboardClient` (loading/error/empty/data + filtros/orden).
- [ ] E2E happy path: Home → Create → Submit → Dashboard.
- [ ] Definir estrategia para cumplir regla de naming (`kebab-case`) sin romper imports ni convenciones actuales.

---

## 🎯 Definición de listo (siguiente release)

- [ ] Persistencia real de compromisos (no memoria local).
- [ ] Wallet real conectada y flujo protegido.
- [ ] Dashboard con acciones completas sobre compromisos.
- [ ] Cobertura mínima de tests del flujo crítico.
- [ ] `check-types` y `lint` del paquete `web` en verde (incluyendo resolución del naming convention).

---

## Histórico (plan original)

# Frontend Tasks - TimeLend

Checklist de trabajo para pasar de la maqueta actual a una versión **completamente funcional** del frontend, basado en los archivos editados:

- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/page.module.css`
- `apps/web/app/page.tsx`
- `apps/web/app/create/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/components/Navbar.tsx`
- `apps/web/components/CreateForm.tsx`
- `apps/web/components/CommitmentCard.tsx`

---

## 0) Base técnica y scripts

- [ ] **Corregir script de desarrollo en `apps/web/package.json`** (`dev.` -> `dev`) para poder ejecutar `pnpm --filter web dev`.
- [ ] **Corregir script de lint** para Next 16 (remover `--max-warnings` si no aplica al comando actual).
- [ ] **Agregar `turbopack.root` en `apps/web/next.config.js`** para eliminar warning de root detectado por lockfiles múltiples.

## 1) Navbar (`Navbar.tsx`, `layout.tsx`, `page.module.css`)

- [ ] **Estado activo de navegación** (`Home`, `Create`, `Dashboard`) usando `usePathname()`.
- [ ] **Responsive real del header**: menú móvil (botón + panel) en lugar de solo ocultar links.
- [ ] **Accesibilidad del nav móvil**: `aria-expanded`, `aria-controls`, cierre con `Esc` y foco gestionado.
- [ ] **Botón `Connect Wallet` funcional (dummy -> real de app)**:
  - [ ] Reemplazar `console.log` por flujo de autenticación/conexión definido por producto.
  - [ ] Mostrar estado visual: `Conectar`, `Conectando...`, `Conectado`.

## 2) Home (`page.tsx`, `page.module.css`)

- [ ] **Conectar CTA principal** a flujo real (`/create` o conexión/autenticación real).
- [ ] **Agregar secciones informativas mínimas** (cómo funciona, beneficios, CTA secundaria) para evitar landing vacía.
- [ ] **Mejorar SEO en metadata** (title/description por página y Open Graph básico).

## 3) Crear compromiso (`create/page.tsx`, `CreateForm.tsx`, `page.module.css`)

- [ ] **Validación de formulario robusta**:
  - [ ] `description` con mínimo de caracteres.
  - [ ] `amount` > 0 y formato correcto.
  - [ ] `deadline` >= hoy y validación de negocio.
- [ ] **Mensajes de error por campo** (no solo `required` del browser).
- [ ] **Estado de envío**: botón deshabilitado durante submit + feedback de éxito/error.
- [ ] **Integrar API real** para crear compromiso (POST) y reemplazar `console.log`.
- [ ] **Redirección al dashboard** o detalle al crear correctamente.
- [ ] **Reset inteligente del formulario** solo al éxito del submit.

## 4) Dashboard (`dashboard/page.tsx`, `CommitmentCard.tsx`, `page.module.css`)

- [ ] **Reemplazar datos hardcodeados por fetch real** de compromisos.
- [ ] **Estados de datos**: loading skeleton, error state y empty state.
- [ ] **Orden y filtros** (por estado y fecha límite).
- [ ] **Formato de fechas y montos por locale** (ej: `es-ES`).
- [ ] **Acciones por tarjeta** (ver detalle, editar, marcar completado) según reglas de negocio.

## 5) Estilos y sistema visual (`globals.css`, `page.module.css`)

- [ ] **Extraer tokens de diseño** adicionales (spacing, radius, sombras, tipografía).
- [ ] **Normalizar tamaños responsivos** en hero/form/cards para mobile-first más consistente.
- [ ] **Mejorar contraste de badges/labels** para WCAG AA.
- [ ] **Estados visuales completos**: hover/focus/disabled/loading en todos los controles.

## 6) Accesibilidad (todos los componentes editados)

- [ ] **Auditoría A11y completa** (teclado, foco, labels, landmarks).
- [ ] **Anunciar errores del formulario** con `aria-live`.
- [ ] **Asegurar jerarquía semántica correcta** (`main`, `section`, headings sin saltos).

## 7) Testing frontend (sobre componentes/páginas editadas)

- [ ] **Tests unitarios** de `CreateForm` (cambios de input, validación y submit).
- [ ] **Tests de render** para `CommitmentCard` según estados.
- [ ] **Tests de navegación** para `Navbar`.
- [ ] **E2E happy path**: Home -> Create -> Submit -> Dashboard.

## 8) Definición de “completamente funcional” (DoD)

- [ ] Crear compromiso desde UI persiste datos en backend.
- [ ] Dashboard muestra datos reales del usuario con loading/error/empty.
- [ ] Navegación responsive y accesible.
- [ ] Botón principal (`Connect Wallet`) conectado al flujo real del producto.
- [ ] `pnpm --filter web check-types`, `build` y `lint` pasan sin errores.
- [ ] Flujo crítico cubierto por tests.

## Validación de Formularios y Estado Local
[ ] Esquemas de validación: Implementar Zod o Yup para el CreateForm.tsx.

Validar que el amount sea mayor a 0.

Validar que el deadline sea una fecha futura.

[ ] Manejo de estados: Implementar react-hook-form para gestionar los inputs de forma eficiente.

[ ] Feedbacks visuales: Agregar estados de error (rojo en inputs) y mensajes de ayuda en el formulario.

## Integración Web3 (The Bridge)
[ ] Configuración de Providers: Configurar Wagmi y TanStack Query en el layout.tsx.

[ ] Wallet Connection: Reemplazar el botón dummy por un modal real (usando RainbowKit o ConnectKit).

[ ] Gestión de Sesión: Crear un hook o componente para proteger las rutas /dashboard y /create (que solo sean accesibles si la wallet está conectada).

## Interacción con Smart Contracts (Escritura)
[ ] Hook de creación: En CreateForm.tsx, usar useWriteContract de Wagmi para enviar los datos a la blockchain.

[ ] Manejo de transacciones: Implementar estados de "Pendiente", "Éxito" y "Error" usando toasts (ej. sonner o react-hot-toast) mientras la transacción se procesa en la red.

[ ] Conversión de tipos: Asegurar que el amount se convierta correctamente a Wei (BigInt) antes de enviarlo.

## Visualización de Datos (Lectura)
[ ] Data Fetching: En Dashboard.tsx, usar useReadContract o useWatchContractEvents para listar los compromisos activos.

[ ] Tipado de la Card: Definir la interfaz Commitment en un archivo de tipos global para que coincida con lo que devuelve el contrato.

[ ] Empty States: Diseñar la vista del dashboard para cuando el usuario no tiene compromisos creados aún.

## UX & Refinamiento Visual
[ ] Loading Skeletons: Implementar Skeletons en el dashboard mientras se cargan los datos de la blockchain.

[ ] Responsive Design: Asegurar que el Navbar y el CreateForm se vean bien en dispositivos móviles (Media queries en los .module.css).

[ ] Dark/Light Mode: Configurar variables de CSS consistentes para soportar ambos temas si el diseño lo requiere.

## Optimización y Deploy
[ ] Manejo de variables de entorno: Mover las direcciones de los contratos y RPC URLs a un archivo .env.

[ ] Build check: Correr npm run build para asegurar que TypeScript no arroje errores de tipos antes del despliegue.

---

## ✅ Checklist final resumen (orden de prioridad)

- [ ] **P0 - Entorno listo**: arreglar scripts `dev` y `lint` + warning de root en `next.config.js`.
- [ ] **P0 - Flujo Create funcional**: validación completa + submit real a API + feedback de éxito/error.
- [ ] **P0 - Dashboard funcional**: reemplazar mock por datos reales + estados `loading/error/empty`.
- [ ] **P1 - Navegación sólida**: estado activo en navbar + menú móvil accesible.
- [ ] **P1 - UX de formularios**: mensajes por campo, disabled/loading y reset solo en éxito.
- [ ] **P1 - Accesibilidad base**: foco visible, navegación por teclado y `aria-live` en errores.
- [ ] **P2 - Calidad visual**: pulir responsive, contraste y estados de componentes.
- [ ] **P2 - Testing mínimo**: unit tests (`CreateForm`, `CommitmentCard`, `Navbar`) + 1 E2E happy path.
- [ ] **P0 - Gate de salida**: `check-types`, `build` y `lint` en verde.

