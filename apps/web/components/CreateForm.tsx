"use client";

import { useState } from "react";

import styles from "../app/page.module.css";

type FormValues = {
  description: string;
  deadline: string;
  amount: string;
};

export function CreateForm() {
  const [formValues, setFormValues] = useState<FormValues>({
    description: "",
    deadline: "",
    amount: "",
  });
  const minDate = new Date().toISOString().split("T")[0];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      description: formValues.description.trim(),
      deadline: formValues.deadline,
      amount: Number(formValues.amount),
    };

    console.log("Create commitment form submit:", payload);
    setFormValues({
      description: "",
      deadline: "",
      amount: "",
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <input
          className={styles.input}
          id="description"
          name="description"
          onChange={handleChange}
          placeholder="Ej. Préstamo para curso"
          required
          type="text"
          value={formValues.description}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="deadline">
          Deadline
        </label>
        <input
          className={styles.input}
          id="deadline"
          min={minDate}
          name="deadline"
          onChange={handleChange}
          required
          type="date"
          value={formValues.deadline}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="amount">
          Amount
        </label>
        <input
          className={styles.input}
          id="amount"
          inputMode="decimal"
          min="0"
          name="amount"
          onChange={handleChange}
          placeholder="0"
          required
          step="0.01"
          type="number"
          value={formValues.amount}
        />
      </div>

      <button className={styles.buttonPrimary} type="submit">
        Create Commitment
      </button>
    </form>
  );
}
