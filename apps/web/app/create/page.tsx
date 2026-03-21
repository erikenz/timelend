import type { Metadata } from "next";
import { CreateForm } from "../../components/CreateForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Crear compromiso",
  description: "Registra un nuevo compromiso con monto y fecha límite.",
};

export default function CreatePage() {
  return (
    <section className={styles.createContainer}>
      <h1 className={styles.title}>Create Commitment</h1>
      <p className={styles.description}>
        Completa los datos para registrar un nuevo compromiso.
      </p>
      <CreateForm />
    </section>
  );
}
