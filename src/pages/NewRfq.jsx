import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatPanel from "../components/ChatPanel.jsx";
import FormField from "../components/FormField.jsx";
import TopBar from "../components/TopBar.jsx";
import { createRfq } from "../api";

const initialForm = {
  id: "",
  customer: "",
  client: "",
  contact: "",
  email: "",
  phone: "",
  application: "",
  productLine: "",
  customerPn: "",
  costingData: "",
  deliveryZone: "",
  revisionLevel: "",
  plant: "",
  country: "",
  sop: "",
  qtyPerYear: "",
  contactName: "",
  contactFunction: "",
  contactPhone: "",
  contactEmail: "",
  rfqReceptionDate: "",
  expectedQuotationDate: "",
  targetPrice: "",
  expectedDeliveryConditions: "",
  expectedPaymentTerms: "",
  businessTrigger: "",
  customerToolingConditions: "",
  entryBarriers: "",
  designResponsible: "",
  validationResponsible: "",
  designOwner: "",
  developmentCosts: "",
  technicalCapacity: "",
  scope: "",
  customerStatus: "",
  strategicNote: "",
  finalRecommendation: "",
  toTotal: "",
  validatorEmail: "",
  item: "",
  quantity: "",
  budget: "",
  dueDate: "",
  status: "RFQ",
  owner: "",
  notes: "",
  location: ""
};

const STEPS = [
  {
    id: "step-client",
    label: "Client Data Collection, Delivery, and Contact",
    accent: "tide"
  },
  {
    id: "step-request",
    label: "Collection of Commercial Expectations",
    accent: "sun"
  },
  {
    id: "step-schedule",
    label: "Collection of Commercial Questions",
    accent: "mint"
  },
  {
    id: "step-notes",
    label: "RFQ validation and submission",
    accent: "ink"
  }
];

const STEP_STYLES = {
  tide: {
    bar: "bg-tide",
    text: "text-tide",
    ring: "border-tide/40",
    bg: "bg-tide/10"
  },
  sun: {
    bar: "bg-sun",
    text: "text-sun",
    ring: "border-sun/40",
    bg: "bg-sun/10"
  },
  mint: {
    bar: "bg-mint",
    text: "text-mint",
    ring: "border-mint/40",
    bg: "bg-mint/10"
  },
  ink: {
    bar: "bg-ink",
    text: "text-ink",
    ring: "border-ink/30",
    bg: "bg-ink/5"
  }
};

const PIPELINE_STAGES = [
  { key: "RFQ", label: "RFQ", accent: "tide" },
  { key: "In costing", label: "In costing", accent: "sun" },
  { key: "Offer preparation", label: "Offer preparation", accent: "ink" },
  { key: "Offer validation", label: "Offer validation", accent: "mint" },
  { key: "Get PO", label: "Get PO", accent: "sun" },
  { key: "PO accepted", label: "PO accepted", accent: "mint" },
  { key: "Mission accepted", label: "Mission accepted", accent: "tide" },
  { key: "Mission not accepted", label: "Mission not accepted", accent: "sun" },
  { key: "Get prototype orders", label: "Get prototype orders", accent: "tide" },
  { key: "Prototype ongoing", label: "Prototype ongoing", accent: "ink" },
  { key: "Lost", label: "Lost", accent: "ink" },
  { key: "Cancelled", label: "Cancelled", accent: "ink" }
];

const STATUS_CHOICES = [
  "RFQ",
  "In costing",
  "Offer preparation",
  "Offer validation",
  "Get PO",
  "PO accepted",
  "Mission accepted",
  "Mission not accepted",
  "Get prototype orders",
  "Prototype ongoing",
  "Lost",
  "Cancelled"
];

export default function NewRfq() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [activeStage, setActiveStage] = useState("RFQ");
  const [activeRfqTab, setActiveRfqTab] = useState("new");
  const [activeStep, setActiveStep] = useState("step-client");
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [rfqFiles, setRfqFiles] = useState([]);
  const rfqFileInputRef = useRef(null);
  const resizeState = useRef({ startX: 0, startWidth: 420 });
  const minChatWidth = 320;
  const maxChatWidth = 620;
  const stepIds = STEPS.map((step) => step.id);
  const stepIndex = stepIds.indexOf(activeStep);
  const isFirstStep = stepIndex <= 0;
  const isLastStep = stepIndex === stepIds.length - 1;
  const activeStepData = STEPS[stepIndex] || STEPS[0];
  const stageIndex = Math.max(
    PIPELINE_STAGES.findIndex((stage) => stage.key === activeStage),
    0
  );
  const isRfqStage = activeStage === "RFQ";
  const isTerminalStage = activeStage === "Lost" || activeStage === "Cancelled";
  const showNextPreview =
    !isTerminalStage && stageIndex < PIPELINE_STAGES.length - 1;
  const visibleStages = PIPELINE_STAGES.slice(
    0,
    stageIndex + 1 + (showNextPreview ? 1 : 0)
  );
  const isChatOnly = true;

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFilesChange = (event) => {
    setRfqFiles(Array.from(event.target.files || []));
  };

  const handleMergeFields = (fields) => {
    setForm((prev) => {
      const next = { ...prev };
      const aliasMap = {
        contact: "contactName",
        email: "contactEmail",
        phone: "contactPhone",
        validator_email: "validatorEmail",
        validatorEmail: "validatorEmail"
      };
      Object.entries(fields || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== "") {
          const targetKey = aliasMap[key] || key;
          next[targetKey] = value;
        }
      });
      return next;
    });
  };

  const handleStageChange = (stageKey) => {
    setActiveStage(stageKey);
    if (STATUS_CHOICES.includes(stageKey)) {
      setForm((prev) => ({ ...prev, status: stageKey }));
    }
  };

  const handleResizeStart = (event) => {
    if (chatCollapsed) {
      return;
    }
    resizeState.current = { startX: event.clientX, startWidth: chatWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeEnd);
  };

  const handleResizeMove = (event) => {
    const delta = resizeState.current.startX - event.clientX;
    const nextWidth = Math.min(
      maxChatWidth,
      Math.max(minChatWidth, resizeState.current.startWidth + delta)
    );
    setChatWidth(nextWidth);
  };

  const handleResizeEnd = () => {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handleResizeMove);
    window.removeEventListener("pointerup", handleResizeEnd);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createRfq({
        id: form.id || `RFQ-${Math.floor(Math.random() * 9000) + 1000}`,
        customer: form.customer,
        client: form.customer || form.client,
        application: form.application,
        productLine: form.productLine,
        customerPn: form.customerPn,
        costingData: form.costingData,
        deliveryZone: form.deliveryZone,
        revisionLevel: form.revisionLevel,
        plant: form.plant,
        country: form.country,
        sop: form.sop,
        qtyPerYear: form.qtyPerYear ? Number(form.qtyPerYear) : 0,
        contactName: form.contactName,
        contactFunction: form.contactFunction,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        rfqReceptionDate: form.rfqReceptionDate,
        expectedQuotationDate: form.expectedQuotationDate,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : 0,
        expectedDeliveryConditions: form.expectedDeliveryConditions,
        expectedPaymentTerms: form.expectedPaymentTerms,
        businessTrigger: form.businessTrigger,
        customerToolingConditions: form.customerToolingConditions,
        entryBarriers: form.entryBarriers,
        designResponsible: form.designResponsible,
        validationResponsible: form.validationResponsible,
        designOwner: form.designOwner,
        developmentCosts: form.developmentCosts ? Number(form.developmentCosts) : 0,
        technicalCapacity: form.technicalCapacity,
        scope: form.scope,
        customerStatus: form.customerStatus,
        strategicNote: form.strategicNote,
        finalRecommendation: form.finalRecommendation,
        toTotal: form.toTotal ? Number(form.toTotal) : 0,
        validatorEmail: form.validatorEmail,
        item: form.productLine || form.item,
        quantity: Number(form.quantity || 0),
        budget: Number(form.budget || 0),
        dueDate: form.dueDate,
        status: form.status,
        owner: form.owner || "Me"
      });
      navigate("/dashboard");
    } catch (error) {
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70">
      <TopBar />

      <div className="pt-4 pb-0 sm:pt-6">
        <div className="w-full">
          <div className="app-shell w-full rounded-none border border-slate-200/70 shadow-card">
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap items-center justify-start gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
                <button
                  type="button"
                  className="back-button"
                  onClick={() => navigate("/dashboard")}
                >
                  <span className="text-base">←</span>
                  Back
                </button>
              </div>

              <div className="px-4 sm:px-6">
                <div className="pipeline-shell">
                  <div className="pipeline-bar">
                    {visibleStages.map((stage, index) => {
                      const isActive = activeStage === stage.key;
                      const isCompleted = index < stageIndex;
                      const isNextPreview = showNextPreview && index === stageIndex + 1;
                      const stepState = isTerminalStage
                        ? "pipeline-step-terminal"
                        : isActive
                          ? "pipeline-step-active"
                          : isCompleted
                            ? "pipeline-step-complete"
                            : "pipeline-step-idle";
                      return (
                        <button
                          key={stage.key}
                          type="button"
                          onClick={
                            isNextPreview ? undefined : () => handleStageChange(stage.key)
                          }
                          disabled={isNextPreview}
                          className={`pipeline-step ${stepState} ${
                            isNextPreview ? "cursor-not-allowed opacity-70" : ""
                          }`}
                          aria-current={isActive ? "step" : undefined}
                          aria-disabled={isNextPreview || undefined}
                        >
                          {stage.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {isRfqStage ? (
                <div className="px-4 sm:px-6">
                  <div className="flex items-center gap-6 border-b border-slate-200/70 text-sm font-semibold text-slate-500">
                    <button
                      type="button"
                      onClick={() => setActiveRfqTab("potential")}
                      className={`pb-3 transition ${activeRfqTab === "potential" ? "border-b-2 border-tide text-ink" : "hover:text-ink"}`}
                    >
                      Potential
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRfqTab("new")}
                      className={`pb-3 transition ${activeRfqTab === "new" ? "border-b-2 border-tide text-ink" : "hover:text-ink"}`}
                    >
                      New RFQ
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className="grid w-full items-stretch gap-3 px-4 pb-0 sm:gap-4 sm:px-6 md:grid-cols-[0.42fr_1fr] lg:grid-cols-[var(--nav-col)_minmax(0,1fr)_var(--chat-col)] lg:px-0"
                style={{
                  "--nav-col": navCollapsed ? "72px" : "0.42fr",
                  "--chat-col": chatCollapsed ? "72px" : `${chatWidth}px`
                }}
              >
                {!isRfqStage ? (
                  <div className="col-span-full flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/70 text-sm font-medium text-slate-500">
                    Empty stage
                  </div>
                ) : null}
                {isRfqStage && activeRfqTab === "potential" ? (
                  <form
                    onSubmit={handleSubmit}
                    className="card relative overflow-hidden space-y-6 p-5 sm:p-7 md:p-8 md:col-span-2 lg:col-span-2"
                  >
                    <div className="pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-tide/10 blur-3xl" />
                    <div className="pointer-events-none absolute -left-24 -bottom-28 h-60 w-60 rounded-full bg-sun/10 blur-3xl" />

                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Potential</p>
                        <h2 className="font-display text-2xl text-ink sm:text-3xl">Potential RFQ intake</h2>
                      </div>
                    </div>

                    <div className="relative grid gap-6">
                      <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-soft transition hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-tide/10 text-sm font-semibold text-tide">
                            01
                          </span>
                          <div>
                            <h3 className="font-display text-xl text-ink">Customer information</h3>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Core business details
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField
                            label="Customer"
                            name="customer"
                            value={form.customer}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Application"
                            name="application"
                            value={form.application}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Product line"
                            name="productLine"
                            value={form.productLine}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Costing data"
                            name="costingData"
                            value={form.costingData}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Customer PN"
                            name="customerPn"
                            value={form.customerPn}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Revision level"
                            name="revisionLevel"
                            value={form.revisionLevel}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-soft transition hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sun/10 text-sm font-semibold text-sun">
                            02
                          </span>
                          <div>
                            <h3 className="font-display text-xl text-ink">Contact information</h3>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                              Primary point of contact
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField
                            label="Contact name"
                            name="contactName"
                            value={form.contactName}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Contact function"
                            name="contactFunction"
                            value={form.contactFunction}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Contact phone"
                            name="contactPhone"
                            value={form.contactPhone}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                          <FormField
                            label="Contact email"
                            name="contactEmail"
                            type="email"
                            value={form.contactEmail}
                            onChange={handleChange}
                            readOnly={isChatOnly}
                          />
                        </div>
                      </section>
                    </div>
                  </form>
                ) : null}
                {isRfqStage && activeRfqTab === "new" ? (
                  <aside
                    className={`card h-full ${navCollapsed ? "p-3 sm:p-4" : "p-4 sm:p-6"} lg:sticky lg:top-28`}
                  >
                    <div className={`flex items-center ${navCollapsed ? "justify-center" : "justify-between"}`}>
                      {!navCollapsed ? (
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">RFQ navigation</p>
                          <h2 className="mt-2 font-display text-xl text-ink">Form steps</h2>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setNavCollapsed((prev) => !prev)}
                        className="collapse-toggle"
                        aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
                      >
                        {navCollapsed ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 19l-7-7 7-7" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {navCollapsed ? (
                      <div className="mt-4 flex flex-col items-center gap-3">
                        {STEPS.map((step, index) => {
                          const isActive = activeStep === step.id;
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setActiveStep(step.id)}
                              className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-sm font-semibold transition sm:h-10 sm:w-10 ${
                                isActive
                                  ? "border-tide/40 bg-tide/10 text-tide"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-tide/40 hover:text-tide"
                              }`}
                              aria-label={`Step ${index + 1}`}
                            >
                              {index + 1}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        {STEPS.map((step, index) => {
                          const style = STEP_STYLES[step.accent];
                          const isActive = activeStep === step.id;
                          const isCompleted = index < stepIndex;
                          const statusLabel = isActive ? "Active" : isCompleted ? "Done" : "Pending";
                          const statusClasses = isActive
                            ? "border-tide/30 bg-tide/10 text-tide"
                            : isCompleted
                              ? "border-mint/30 bg-mint/10 text-mint"
                              : "border-slate-200 bg-slate-100 text-slate-500";
                          return (
                            <button
                              key={step.id}
                              type="button"
                              onClick={() => setActiveStep(step.id)}
                              aria-pressed={isActive}
                              className={`group flex w-full gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                                isActive
                                  ? `${style.ring} ${style.bg} shadow-soft`
                                  : "border-slate-200/70 bg-white/80 hover:border-tide/40 hover:shadow-soft"
                              }`}
                            >
                              <span className={`mt-1 h-full w-1 rounded-full ${style.bar}`} />
                              <span className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-white text-xs font-semibold text-slate-500 transition ${isActive ? "border-tide/40 text-tide" : "border-slate-200 group-hover:border-tide/40 group-hover:text-tide"}`}>
                                {index + 1}
                              </span>
                              <span className="flex flex-col gap-1">
                                <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                                  Step {index + 1}
                                </span>
                                <span className="font-semibold text-ink">{step.label}</span>
                                <span className={`mt-2 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses}`}>
                                  {statusLabel}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </aside>
                ) : null}
                {isRfqStage && activeRfqTab === "new" ? (
                  <form
                    onSubmit={handleSubmit}
                    className="card space-y-6 p-5 sm:space-y-8 sm:p-7 md:p-8"
                  >
                      <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tide text-base font-semibold text-white shadow-soft sm:h-14 sm:w-14 sm:text-lg">
                              {stepIndex + 1}
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Step</p>
                              <h2 className="font-display text-xl text-ink sm:text-2xl">
                                Step {stepIndex + 1}: {activeStepData.label}
                              </h2>
                            </div>
                          </div>
                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <button
                              type="button"
                              className="prev-button disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => setActiveStep(stepIds[stepIndex - 1])}
                              disabled={isFirstStep}
                            >
                              <span className="text-base">←</span>
                              Previous
                            </button>
                            <button
                              type="button"
                              className="next-button disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => setActiveStep(stepIds[stepIndex + 1])}
                              disabled={isLastStep}
                            >
                              Next
                              <span className="text-base">→</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {activeStep === "step-client" ? (
                        <div
                          id="step-client"
                          className="scroll-mt-28 space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5"
                        >
                          <div className="flex flex-col gap-5">
                            <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-soft transition hover:shadow-md">
                              <h3 className="mt-2 font-display text-xl font-semibold text-sun">Customer details</h3>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <FormField
                                  label="Customer"
                                  name="customer"
                                  value={form.customer}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Application"
                                  name="application"
                                  value={form.application}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Product line"
                                  name="productLine"
                                  value={form.productLine}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Costing data"
                                  name="costingData"
                                  value={form.costingData}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500 md:col-span-2 lg:col-span-1">
                                  <span>RFQ Files</span>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <button
                                      type="button"
                                      className="outline-button px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                                      onClick={() => rfqFileInputRef.current?.click()}
                                      disabled={isChatOnly}
                                    >
                                      Choose files
                                    </button>
                                    <span className="text-xs font-medium text-slate-500">
                                      {rfqFiles.length
                                        ? `${rfqFiles.length} file(s) selected`
                                        : "No files selected"}
                                    </span>
                                  </div>
                                  <input
                                    ref={rfqFileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFilesChange}
                                    disabled={isChatOnly}
                                  />
                                </label>
                                <FormField
                                  label="Customer PN"
                                  name="customerPn"
                                  value={form.customerPn}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Revision level"
                                  name="revisionLevel"
                                  value={form.revisionLevel}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-soft transition hover:shadow-md">
                              <h3 className="mt-2 font-display text-xl font-semibold text-sun">Logistics details</h3>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <FormField
                                  label="Delivery zone"
                                  name="deliveryZone"
                                  value={form.deliveryZone}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Plant"
                                  name="plant"
                                  value={form.plant}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Country"
                                  name="country"
                                  value={form.country}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="SOP year"
                                  name="sop"
                                  type="number"
                                  value={form.sop}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Quantity per year"
                                  name="qtyPerYear"
                                  type="number"
                                  value={form.qtyPerYear}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="RFQ reception date"
                                  name="rfqReceptionDate"
                                  type="date"
                                  value={form.rfqReceptionDate}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Expected quotation date"
                                  name="expectedQuotationDate"
                                  type="date"
                                  value={form.expectedQuotationDate}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-5 shadow-soft transition hover:shadow-md">
                              <h3 className="mt-2 font-display text-xl font-semibold text-sun">Contact details</h3>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <FormField
                                  label="Contact name"
                                  name="contactName"
                                  value={form.contactName}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Contact function"
                                  name="contactFunction"
                                  value={form.contactFunction}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Contact phone"
                                  name="contactPhone"
                                  value={form.contactPhone}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                                <FormField
                                  label="Contact email"
                                  name="contactEmail"
                                  type="email"
                                  value={form.contactEmail}
                                  onChange={handleChange}
                                  readOnly={isChatOnly}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {activeStep === "step-request" ? (
                        <div
                          id="step-request"
                          className="scroll-mt-28 space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              label="Target Price"
                              name="targetPrice"
                              type="number"
                              value={form.targetPrice}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Expected Delivery Conditions"
                              name="expectedDeliveryConditions"
                              value={form.expectedDeliveryConditions}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Expected Payment Terms"
                              name="expectedPaymentTerms"
                              value={form.expectedPaymentTerms}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Business Trigger"
                              name="businessTrigger"
                              value={form.businessTrigger}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Customer Tooling Conditions"
                              name="customerToolingConditions"
                              value={form.customerToolingConditions}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Entry Barriers"
                              name="entryBarriers"
                              value={form.entryBarriers}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                          </div>
                        </div>
                      ) : null}

                      {activeStep === "step-schedule" ? (
                        <div
                          id="step-schedule"
                          className="scroll-mt-28 space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              label="Design responsible"
                              name="designResponsible"
                              value={form.designResponsible}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Validation responsible"
                              name="validationResponsible"
                              value={form.validationResponsible}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Design owner"
                              name="designOwner"
                              value={form.designOwner}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Development costs"
                              name="developmentCosts"
                              type="number"
                              value={form.developmentCosts}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Technical capacity"
                              name="technicalCapacity"
                              value={form.technicalCapacity}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Scope"
                              name="scope"
                              value={form.scope}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Customer status"
                              name="customerStatus"
                              value={form.customerStatus}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Strategic note"
                              name="strategicNote"
                              value={form.strategicNote}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Final recommendation"
                              name="finalRecommendation"
                              value={form.finalRecommendation}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                          </div>
                        </div>
                      ) : null}

                      {activeStep === "step-notes" ? (
                        <div
                          id="step-notes"
                          className="scroll-mt-28 space-y-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5"
                        >
                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              label="TO total"
                              name="toTotal"
                              type="number"
                              value={form.toTotal}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                            <FormField
                              label="Validator email"
                              name="validatorEmail"
                              type="email"
                              value={form.validatorEmail}
                              onChange={handleChange}
                              readOnly={isChatOnly}
                            />
                          </div>
                        </div>
                      ) : null}
                  </form>
                ) : null}
                {isRfqStage ? (
                  <div className="h-full md:col-span-2 lg:col-span-1 lg:sticky lg:top-28">
                    {chatCollapsed ? (
                      <div className="card flex h-full flex-col items-center justify-center gap-3 p-3">
                        <button
                          type="button"
                          onClick={() => setChatCollapsed(false)}
                          className="collapse-toggle"
                          aria-label="Expand chatbot"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-tide/10 text-tide">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-full">
                        <button
                          type="button"
                          onPointerDown={handleResizeStart}
                          className="chat-resize-handle"
                          aria-label="Resize chatbot"
                        >
                          <span className="h-12 w-1 rounded-full bg-slate-300/80" />
                        </button>
                        <ChatPanel
                          onFields={handleMergeFields}
                          currentFields={form}
                          onCollapse={() => setChatCollapsed(true)}
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

