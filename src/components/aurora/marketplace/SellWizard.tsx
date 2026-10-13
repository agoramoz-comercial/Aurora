import { useEffect, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Rocket } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  type Category,
  type Condition,
  type Listing,
} from "@/data/marketplaceData";
import { useMarketplace } from "@/data/marketplaceStore";
import { cn } from "@/lib/utils";
import { Drawer } from "../primitives";
import { CATEGORY_ICON, ListingCard } from "./ListingCard";

const CONDITIONS: Condition[] = ["Novo", "Como novo", "Excelente", "Muito bom", "Coleção"];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [Category, ...Category[]];

const schema = z
  .object({
    category: z.enum(CATEGORY_IDS),
    brand: z.string().trim().min(2, "Indique a marca ou maison"),
    title: z.string().trim().min(4, "Título demasiado curto").max(80, "Máximo 80 caracteres"),
    subtitle: z.string().trim().max(90, "Máximo 90 caracteres"),
    location: z.string().trim().min(2, "Indique a localização"),
    condition: z.enum(CONDITIONS as [Condition, ...Condition[]]),
    description: z.string().trim().min(20, "Descreva o ativo (mín. 20 caracteres)"),
    specs: z.array(z.string().trim()).length(4),
    priceUsd: z
      .number({ invalid_type_error: "Indique o preço" })
      .min(1000, "Preço mínimo $1.000")
      .max(2_000_000_000, "Valor fora do intervalo"),
    images: z.array(z.string().trim().url("URL inválido").or(z.literal(""))).length(3),
    eventDate: z.string(),
    stock: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.specs.filter(Boolean).length < 2)
      ctx.addIssue({
        code: "custom",
        path: ["specs", 0],
        message: "Preencha pelo menos 2 especificações",
      });
    if (v.category === "tickets") {
      if (!v.eventDate)
        ctx.addIssue({ code: "custom", path: ["eventDate"], message: "Indique a data do evento" });
      const n = Number(v.stock);
      if (!Number.isInteger(n) || n < 1)
        ctx.addIssue({ code: "custom", path: ["stock"], message: "Número de lugares inválido" });
    }
  });

type FormValues = z.infer<typeof schema>;

const STEPS: { label: string; fields: FieldPath<FormValues>[] }[] = [
  { label: "Categoria", fields: ["category"] },
  {
    label: "Detalhes",
    fields: [
      "brand",
      "title",
      "subtitle",
      "location",
      "condition",
      "description",
      "specs",
      "eventDate",
      "stock",
    ],
  },
  { label: "Preço & fotos", fields: ["priceUsd", "images"] },
  { label: "Rever", fields: [] },
];

function defaults(l?: Listing | null): FormValues {
  return {
    category: l?.category ?? "cars",
    brand: l?.brand ?? "",
    title: l?.title ?? "",
    subtitle: l?.subtitle ?? "",
    location: l?.location ?? "",
    condition: l?.condition ?? "Excelente",
    description: l?.description ?? "",
    specs: [0, 1, 2, 3].map((i) => l?.specs[i]?.value ?? ""),
    priceUsd: l?.priceUsd ?? (undefined as unknown as number),
    images: [0, 1, 2].map((i) => l?.images[i] ?? ""),
    eventDate: l?.eventDate ? l.eventDate.slice(0, 10) : "",
    stock: l?.stock !== undefined ? String(l.stock) : "",
  };
}

function toListing(v: FormValues, base?: Listing | null): Listing {
  const meta = CATEGORY_BY_ID[v.category];
  return {
    id: base?.id ?? `mine-${Date.now().toString(36)}`,
    category: v.category,
    brand: v.brand,
    title: v.title,
    subtitle: v.subtitle || meta.singular,
    description: v.description,
    priceUsd: v.priceUsd,
    location: v.location,
    images: v.images.filter(Boolean),
    specs: meta.specFields
      .map((label, i) => ({ label, value: v.specs[i] ?? "" }))
      .filter((s) => s.value),
    seller: {
      name: "A sua coleção",
      verified: true,
      rating: 5,
      sales: 0,
      since: new Date().getFullYear(),
    },
    condition: v.condition,
    tags: [],
    listedAt: base?.listedAt ?? new Date().toISOString().slice(0, 10),
    views: base?.views ?? 0,
    watchers: base?.watchers ?? 0,
    eventDate:
      v.category === "tickets" && v.eventDate ? new Date(v.eventDate).toISOString() : undefined,
    stock: v.category === "tickets" ? Number(v.stock) : undefined,
    mine: true,
  };
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[11px] font-semibold text-white/65">{label}</span>
      {children}
      {error ? <span className="text-[11px] text-[var(--aurora-negative)]">{error}</span> : null}
    </label>
  );
}

const inputCls =
  "h-10 w-full rounded-xl bg-black/30 px-3 text-[13px] text-white outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] placeholder:text-white/30 focus:shadow-[inset_0_0_0_1px_rgba(74,158,255,0.6)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_rgba(248,113,113,0.6)]";

export function SellWizard({
  open,
  editing,
  onClose,
  onPublished,
}: {
  open: boolean;
  editing: Listing | null;
  onClose: () => void;
  onPublished: (l: Listing) => void;
}) {
  const store = useMarketplace();
  const [step, setStep] = useState(0);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(editing),
    mode: "onTouched",
  });
  const { register, watch, setValue, trigger, handleSubmit, reset, formState } = form;
  const errors = formState.errors;

  useEffect(() => {
    if (open) {
      reset(defaults(editing));
      setStep(editing ? 1 : 0);
    }
  }, [open, editing, reset]);

  const values = watch();
  const meta = CATEGORY_BY_ID[values.category];

  const next = async () => {
    const ok = await trigger(STEPS[step]!.fields);
    if (ok) setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const publish = handleSubmit((v) => {
    const listing = toListing(v, editing);
    store.publishListing(listing);
    onPublished(listing);
  });

  const preview = (() => {
    const parsed = schema.safeParse(values);
    return parsed.success ? toListing(parsed.data, editing) : null;
  })();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      eyebrow={
        <ol className="flex flex-wrap items-center gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold tabular-nums",
                  i < step
                    ? "bg-[var(--aurora-positive)] text-[#0b1020]"
                    : i === step
                      ? "bg-[var(--aurora-accent)] text-white"
                      : "bg-white/10 text-white/45",
                )}
              >
                {i < step ? <Check size={11} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  i === step ? "text-white" : "text-white/45",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? <span className="mx-0.5 h-px w-4 bg-white/15" /> : null}
            </li>
          ))}
        </ol>
      }
      title={editing ? "Editar anúncio" : "Anunciar ativo"}
      footer={
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              step === 0 || (editing && step === 1) ? onClose() : setStep((s) => s - 1)
            }
            className="flex h-10 items-center gap-1.5 rounded-xl px-4 text-[12px] font-semibold text-white/65 hover:bg-white/8 hover:text-white"
          >
            <ArrowLeft size={14} /> {step === 0 || (editing && step === 1) ? "Cancelar" : "Voltar"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-5 text-[12px] font-bold text-[#0b1020] transition-transform active:scale-[0.97]"
            >
              Continuar <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              className="flex h-10 items-center gap-1.5 rounded-xl px-5 text-[12px] font-bold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97]"
              style={{
                background: "var(--aurora-accent)",
                boxShadow: "0 0 24px rgba(74,158,255,0.45)",
              }}
            >
              <Rocket size={14} /> {editing ? "Guardar alterações" : "Publicar anúncio"}
            </button>
          )}
        </div>
      }
    >
      <form className="flex flex-col gap-4 p-5" onSubmit={(e) => e.preventDefault()}>
        {step === 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c.id];
              const active = values.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setValue("category", c.id, { shouldValidate: true })}
                  aria-pressed={active}
                  className="flex flex-col items-start gap-3 rounded-[16px] p-4 text-left transition-[background-color,box-shadow] duration-150"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${c.color}30, ${c.color}0d)`
                      : "var(--aurora-surface-1)",
                    boxShadow: active
                      ? `inset 0 0 0 1px ${c.color}aa`
                      : "inset 0 0 0 1px var(--aurora-hairline)",
                  }}
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-[12px]"
                    style={{ background: `${c.color}22`, color: c.color }}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                  <span className="text-[13px] font-semibold text-white">{c.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Marca / Maison" error={errors.brand?.message}>
              <input
                {...register("brand")}
                className={inputCls}
                placeholder="Ex.: Rolex"
                aria-invalid={!!errors.brand}
              />
            </Field>
            <Field label="Localização" error={errors.location?.message}>
              <input
                {...register("location")}
                className={inputCls}
                placeholder="Ex.: Maputo"
                aria-invalid={!!errors.location}
              />
            </Field>
            <Field label="Título" error={errors.title?.message} className="sm:col-span-2">
              <input
                {...register("title")}
                className={inputCls}
                placeholder="Ex.: Rolex Daytona 126506 Ice Blue"
                aria-invalid={!!errors.title}
              />
            </Field>
            <Field
              label="Subtítulo (opcional)"
              error={errors.subtitle?.message}
              className="sm:col-span-2"
            >
              <input
                {...register("subtitle")}
                className={inputCls}
                placeholder="Uma linha que resume o ativo"
              />
            </Field>
            {meta.specFields.map((label, i) => (
              <Field
                key={label}
                label={label}
                error={i === 0 ? errors.specs?.[0]?.message : undefined}
              >
                <input {...register(`specs.${i}` as const)} className={inputCls} />
              </Field>
            ))}
            {values.category === "tickets" ? (
              <>
                <Field label="Data do evento" error={errors.eventDate?.message}>
                  <input
                    type="date"
                    {...register("eventDate")}
                    className={cn(inputCls, "[color-scheme:dark]")}
                    aria-invalid={!!errors.eventDate}
                  />
                </Field>
                <Field label="Lugares disponíveis" error={errors.stock?.message}>
                  <input
                    inputMode="numeric"
                    {...register("stock")}
                    className={inputCls}
                    placeholder="Ex.: 4"
                    aria-invalid={!!errors.stock}
                  />
                </Field>
              </>
            ) : null}
            <Field label="Estado" className="sm:col-span-2">
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue("condition", c)}
                    aria-pressed={values.condition === c}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                      values.condition === c
                        ? "bg-[var(--aurora-accent)] text-white"
                        : "bg-white/8 text-white/60 hover:bg-white/14",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Descrição" error={errors.description?.message} className="sm:col-span-2">
              <textarea
                {...register("description")}
                rows={4}
                className={cn(inputCls, "h-auto resize-none py-2.5")}
                placeholder="Proveniência, histórico, documentação, extras incluídos…"
                aria-invalid={!!errors.description}
              />
            </Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-3">
            <Field
              label={values.category === "tickets" ? "Preço por lugar (USD)" : "Preço pedido (USD)"}
              error={errors.priceUsd?.message}
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-white/40">
                  $
                </span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  {...register("priceUsd", { valueAsNumber: true })}
                  className={cn(inputCls, "h-12 pl-7 text-[18px] font-semibold tabular-nums")}
                  aria-invalid={!!errors.priceUsd}
                />
              </div>
            </Field>
            {[0, 1, 2].map((i) => (
              <Field
                key={i}
                label={`Fotografia ${i + 1} · URL (opcional)`}
                error={errors.images?.[i]?.message}
              >
                <input
                  {...register(`images.${i}` as const)}
                  className={inputCls}
                  placeholder="https://…"
                  aria-invalid={!!errors.images?.[i]}
                />
              </Field>
            ))}
            <p className="text-[11px] text-white/40">
              Sem fotografia, o anúncio usa a arte da categoria. Recomendado: imagens horizontais
              4:3.
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          preview ? (
            <div className="grid gap-4 sm:grid-cols-[260px_1fr]">
              <div className="pointer-events-none">
                <ListingCard
                  listing={preview}
                  index={0}
                  favorite={false}
                  onToggleFavorite={() => {}}
                  onOpen={() => {}}
                />
              </div>
              <div className="flex flex-col gap-2 text-[12px] text-white/65">
                <p className="text-[13px] font-semibold text-white">Tudo pronto para publicar.</p>
                <p>
                  O anúncio aparece de imediato no catálogo e em “Minhas vendas”. Pode editá-lo ou
                  retirá-lo a qualquer momento.
                </p>
                <p className="text-[11px] text-white/40">
                  Os dados ficam guardados neste navegador. Nenhum pagamento é processado pela
                  plataforma.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--aurora-negative)]">
              Há campos por corrigir nos passos anteriores.
            </p>
          )
        ) : null}
      </form>
    </Drawer>
  );
}
