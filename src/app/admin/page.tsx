import { redirect } from 'next/navigation';

// La ruta /admin ahora solo redirige.
// El login está en /admin/login y el dashboard en /admin/dashboard.
export default function AdminRootPage() {
    redirect('/admin/dashboard');
}
