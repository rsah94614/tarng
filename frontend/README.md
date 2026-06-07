# Tarng - Frontend

This is the frontend application for **Tarng**, a modern social media platform where users can post content, join communities (Waves), and engage in real-time conversations.

## 🚀 Tech Stack

The frontend is built with modern web technologies, focusing on performance, beautiful UI/UX, and seamless developer experience:

- **Framework**: [Next.js](https://nextjs.org) (App Router, Server Components)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Client-side global state) & [React Query](https://tanstack.com/query/latest) (Server state & caching)
- **UI Components**: custom components built with [Base UI](https://base-ui.com/), augmented with Tailwind for a polished, modern look.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching**: [Axios](https://axios-http.com/) with custom interceptors for JWT token rotation.
- **Real-Time**: WebSockets for live notifications.

## 📦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm / yarn / pnpm

### Environment Variables
Copy `.env.local.example` to `.env.local` and set the required variables:

```bash
cp .env.local.example .env.local
```

Example `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000/api/v1/ws
```

### Installation
Install the dependencies:

```bash
npm install
```

### Running the Development Server
Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application running.

## 📂 Project Structure

- `/app`: Next.js App Router pages and layouts.
- `/components`: Reusable UI components.
  - `/ui`: Atomic, base components (Buttons, Inputs, Spinners, Avatars).
  - `/layout`: Structural components (Sidebar, AppShell, Nav).
  - `/auth`: Login, Signup, and Password management forms.
  - `/posts`: Feed lists, post cards, and reaction bars.
  - `/communities`: Wave cards, headers, and lists.
- `/services`: Axios-based API wrappers mapped to backend endpoints.
- `/store`: Zustand stores for global client state (Auth, Notifications).
- `/lib`: Utility functions, Axios configuration, and WebSocket managers.
- `/types`: TypeScript type definitions shared across the app.

## 💅 UI/UX Highlights

- **Smooth Micro-interactions**: Buttons and links feature tactile scale effects and soft shadow transitions.
- **Modern Depth**: Feed cards lift subtly on hover (`-translate-y-1`) with dynamic shadows.
- **Fluid Layouts**: The application shell implements bottom-up fade-in entrances to ensure a non-jarring navigation experience.

## 🛠️ Build for Production

To create an optimized production build:

```bash
npm run build
npm start
```
