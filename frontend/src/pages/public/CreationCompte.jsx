// =============================================================================
// SGCM - pages/public/CreationCompte.jsx
// Formulaire d'inscription patient : validation client + ReCaptcha v2 + appel API.
// =============================================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { registerPatient, ApiError } from "../../services/apiAuth";
import { validateRegisterForm } from "../../utils/validators";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const INITIAL_VALUES = {
    email: "",
    motDePasse: "",
    confirmation: "",
    nom: "",
    prenom: "",
    dateNaissance: "",
    telephone: "",
    adresse: "",
    numeroAssure: "",
};

export default function CreationCompte() {
    const [values, setValues] = useState(INITIAL_VALUES);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [serverMessage, setServerMessage] = useState(null);
    const [recaptchaToken, setRecaptchaToken] = useState(null);

    const recaptchaContainerRef = useRef(null);
    const recaptchaWidgetId = useRef(null);

    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY) {
            console.error("[ReCaptcha] VITE_RECAPTCHA_SITE_KEY est manquant.");
            return;
        }

        function renderWidget() {
            if (
                window.grecaptcha &&
                recaptchaContainerRef.current &&
                recaptchaWidgetId.current === null
            ) {
                recaptchaWidgetId.current = window.grecaptcha.render(
                    recaptchaContainerRef.current,
                    {
                        sitekey: RECAPTCHA_SITE_KEY,
                        callback: (token) => setRecaptchaToken(token),
                        "expired-callback": () => setRecaptchaToken(null),
                        "error-callback": () => setRecaptchaToken(null),
                    },
                );
            }
        }

        if (window.grecaptcha && window.grecaptcha.render) {
            renderWidget();
            return;
        }

        const existingScript = document.getElementById("recaptcha-script");
        if (!existingScript) {
            const script = document.createElement("script");
            script.id = "recaptcha-script";
            script.src = "https://www.google.com/recaptcha/api.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }

        const interval = setInterval(() => {
            if (window.grecaptcha && window.grecaptcha.render) {
                clearInterval(interval);
                renderWidget();
            }
        }, 200);

        return () => clearInterval(interval);
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }, []);

    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            setServerMessage(null);

            const validationErrors = validateRegisterForm(values);

            if (!recaptchaToken) {
                validationErrors.recaptcha = "Merci de valider le ReCaptcha.";
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                return;
            }

            setSubmitting(true);
            try {
                await registerPatient({
                    email: values.email.trim(),
                    motDePasse: values.motDePasse,
                    nom: values.nom.trim(),
                    prenom: values.prenom.trim(),
                    dateNaissance: values.dateNaissance,
                    telephone: values.telephone.trim() || undefined,
                    adresse: values.adresse.trim(),
                    numeroAssure: values.numeroAssure.trim(),
                    recaptchaToken,
                });

                setServerMessage({
                    type: "success",
                    text: "Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.",
                });
                setValues(INITIAL_VALUES);
                setErrors({});

                if (window.grecaptcha && recaptchaWidgetId.current !== null) {
                    window.grecaptcha.reset(recaptchaWidgetId.current);
                }
                setRecaptchaToken(null);
            } catch (err) {
                if (err instanceof ApiError) {
                    setServerMessage({ type: "error", text: err.message });

                    if (
                        window.grecaptcha &&
                        recaptchaWidgetId.current !== null
                    ) {
                        window.grecaptcha.reset(recaptchaWidgetId.current);
                    }
                    setRecaptchaToken(null);
                } else {
                    setServerMessage({
                        type: "error",
                        text: "Une erreur inattendue est survenue. Merci de réessayer.",
                    });
                }
            } finally {
                setSubmitting(false);
            }
        },
        [values, recaptchaToken],
    );

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">
                Créer mon compte patient
            </h1>

            {serverMessage && (
                <div
                    role="alert"
                    className={`mb-4 rounded-md p-4 text-sm ${
                        serverMessage.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                >
                    {serverMessage.text}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="email"
                />

                <Field
                    label="Mot de passe"
                    name="motDePasse"
                    type="password"
                    value={values.motDePasse}
                    onChange={handleChange}
                    error={errors.motDePasse}
                    autoComplete="new-password"
                    hint="Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre."
                />

                <Field
                    label="Confirmer le mot de passe"
                    name="confirmation"
                    type="password"
                    value={values.confirmation}
                    onChange={handleChange}
                    error={errors.confirmation}
                    autoComplete="new-password"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Field
                        label="Nom"
                        name="nom"
                        value={values.nom}
                        onChange={handleChange}
                        error={errors.nom}
                    />
                    <Field
                        label="Prénom"
                        name="prenom"
                        value={values.prenom}
                        onChange={handleChange}
                        error={errors.prenom}
                    />
                </div>

                <Field
                    label="Date de naissance"
                    name="dateNaissance"
                    type="date"
                    value={values.dateNaissance}
                    onChange={handleChange}
                    error={errors.dateNaissance}
                />

                <Field
                    label="Téléphone (optionnel)"
                    name="telephone"
                    type="tel"
                    value={values.telephone}
                    onChange={handleChange}
                    error={errors.telephone}
                    autoComplete="tel"
                />

                <Field
                    label="Adresse"
                    name="adresse"
                    value={values.adresse}
                    onChange={handleChange}
                    error={errors.adresse}
                />

                <Field
                    label="Numéro d'assuré"
                    name="numeroAssure"
                    value={values.numeroAssure}
                    onChange={handleChange}
                    error={errors.numeroAssure}
                    hint="Format : 756.XXXX.XXXX.XX"
                />

                <div>
                    <div ref={recaptchaContainerRef} />
                    {errors.recaptcha && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.recaptcha}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-medium
                               hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed
                               transition-colors"
                >
                    {submitting ? "Création en cours..." : "Créer mon compte"}
                </button>
            </form>
        </div>
    );
}

function Field({
    label,
    name,
    type = "text",
    value,
    onChange,
    error,
    hint,
    autoComplete,
}) {
    return (
        <div>
            <label
                htmlFor={name}
                className="block text-sm font-medium text-gray-700 mb-1"
            >
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${name}-error` : undefined}
                className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2
                    ${
                        error
                            ? "border-red-500 focus:ring-red-200"
                            : "border-gray-300 focus:ring-blue-200"
                    }`}
            />
            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500">{hint}</p>
            )}
            {error && (
                <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
