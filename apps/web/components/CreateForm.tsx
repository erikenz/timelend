"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "../app/page.module.css";
import type {
  CommitmentFieldErrors,
  CreateCommitmentInput,
} from "../lib/commitments";
import { validateCommitmentInput } from "../lib/commitments";

interface FormValues {
  amount: string;
  deadline: string;
  description: string;
}

export function CreateForm() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>({
    description: "",
    deadline: "",
    amount: "",
  });
  const [fieldErrors, setFieldErrors] = useState<CommitmentFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const minDate = new Date().toISOString().split("T")[0];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: CreateCommitmentInput = {
      description: formValues.description.trim(),
      deadline: formValues.deadline,
      amount: Number(formValues.amount),
    };

    const nextFieldErrors = validateCommitmentInput(payload);
    setFieldErrors(nextFieldErrors);
    setSubmitError(null);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/commitments", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const responsePayload = (await response.json()) as {
          fieldErrors?: CommitmentFieldErrors;
          error?: string;
        };
        setFieldErrors(responsePayload.fieldErrors ?? {});
        setSubmitError(
          responsePayload.error ?? "No se pudo crear el compromiso."
        );
        return;
      }

      setFormValues({
        description: "",
        deadline: "",
        amount: "",
      });
      setFieldErrors({});
      router.push("/dashboard");
    } catch {
      setSubmitError("Ocurrió un error inesperado al crear el compromiso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <input
          aria-describedby="description-error"
          aria-invalid={Boolean(fieldErrors.description)}
          className={`${styles.input} ${fieldErrors.description ? styles.inputError : ""}`}
          id="description"
          name="description"
          onChange={handleChange}
          placeholder="Ej. Préstamo para curso"
          type="text"
          value={formValues.description}
        />
        <p
          aria-live="polite"
          className={styles.fieldError}
          id="description-error"
        >
          {fieldErrors.description ?? ""}
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          Deadline
        </label>
        <input
          aria-describedby="deadline-error"
          aria-invalid={Boolean(fieldErrors.deadline)}
          className={`${styles.input} ${fieldErrors.deadline ? styles.inputError : ""}`}
          id="deadline"
          min={minDate}
          name="deadline"
          onChange={handleChange}
          type="date"
          value={formValues.deadline}
        />
        <p aria-live="polite" className={styles.fieldError} id="deadline-error">
          {fieldErrors.deadline ?? ""}
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="amount">
          Amount
        </label>
        <input
          aria-describedby="amount-error"
          aria-invalid={Boolean(fieldErrors.amount)}
          className={`${styles.input} ${fieldErrors.amount ? styles.inputError : ""}`}
          id="amount"
          inputMode="decimal"
          min="0"
          name="amount"
          onChange={handleChange}
          placeholder="0"
          step="0.01"
          type="number"
          value={formValues.amount}
        />
        <p aria-live="polite" className={styles.fieldError} id="amount-error">
          {fieldErrors.amount ?? ""}
        </p>
      </div>

      <p aria-live="polite" className={styles.fieldError}>
        {submitError ?? ""}
      </p>

      <button
        className={styles.buttonPrimary}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creando..." : "Create Commitment"}
      </button>
    </form>
  );
}
