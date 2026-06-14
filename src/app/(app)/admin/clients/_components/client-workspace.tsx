"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { EmptyState } from "@/components/kit/data-state";
import { StatusBadge } from "@/components/kit/status-badge";
import { PageHeader } from "@/components/kit/page-header";
import { engagementLabel, BILLING_INCREMENT_LABELS } from "@/lib/admin-enums";
import {
  EMPTY_VALUE,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatHours,
} from "@/lib/format";

import { ClientForm } from "./client-form";
import { ContactForm } from "./contact-form";
import { ProjectForm } from "./project-form";
import { SubProjectForm } from "./subproject-form";
import type { ClientDetail } from "../types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm">{value ?? EMPTY_VALUE}</div>
    </div>
  );
}

export function ClientWorkspace({ detail }: { detail: ClientDetail }) {
  const { client, projects, contacts, pricing } = detail;

  return (
    <section className="min-w-0 flex-1">
      <PageHeader
        title={client.name}
        description={engagementLabel(client.engagement_model)}
        actions={
          <ClientForm
            client={client}
            trigger={
              <Button variant="outline" size="sm">
                Edit client
              </Button>
            }
          />
        }
      />

      <Tabs defaultValue="overview" className="flex flex-row gap-6">
        <TabsList className="flex h-auto w-44 shrink-0 flex-col items-stretch gap-1 bg-transparent p-0">
          <TabsTrigger value="overview" className="justify-start">
            Overview
          </TabsTrigger>
          <TabsTrigger value="projects" className="justify-start">
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="justify-start">
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="pricing" className="justify-start">
            Pricing
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
          {/* Overview */}
          <TabsContent value="overview" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Engagement &amp; details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Engagement model"
                    value={engagementLabel(client.engagement_model)}
                  />
                  <Field
                    label="Status"
                    value={
                      <StatusBadge
                        status={client.is_active ? "active" : "archived"}
                        label={client.is_active ? "Active" : "Inactive"}
                      />
                    }
                  />
                  <Field label="Industry" value={client.industry} />
                  <Field
                    label="FileMaker client ID"
                    value={client.fm_client_id}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects + sub-projects */}
          <TabsContent value="projects" className="mt-0 space-y-3">
            <div className="flex justify-end">
              <ProjectForm
                clientId={client.id}
                trigger={
                  <Button size="sm" variant="outline">
                    New project
                  </Button>
                }
              />
            </div>
            {projects.length === 0 ? (
              <EmptyState
                title="No projects yet"
                description="Create the first project for this client."
              />
            ) : (
              projects.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {p.name}
                        <StatusBadge status={p.status} />
                        {p.is_internal ? (
                          <StatusBadge status="info" label="Internal" />
                        ) : null}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        SOW {formatHours(
                          p.sow_hours != null ? p.sow_hours * 60 : null,
                          0,
                        )}
                        h · Rate {formatCurrency(p.default_rate_per_hour)}
                      </p>
                    </div>
                    <ProjectForm
                      clientId={client.id}
                      project={p}
                      trigger={
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      }
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Sub-projects (SOW)
                      </span>
                      <SubProjectForm
                        projectId={p.id}
                        trigger={
                          <Button size="sm" variant="ghost">
                            Add sub-project
                          </Button>
                        }
                      />
                    </div>
                    {p.sub_projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No sub-projects.
                      </p>
                    ) : (
                      <ul className="divide-y rounded-md border">
                        {p.sub_projects.map((sp) => (
                          <li
                            key={sp.id}
                            className="flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <span className="flex items-center gap-2 text-sm">
                                <span className="truncate">{sp.name}</span>
                                <StatusBadge status={sp.status} />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(sp.start_date)} –{" "}
                                {formatDate(sp.end_date)}
                              </span>
                            </div>
                            <SubProjectForm
                              projectId={p.id}
                              subProject={sp}
                              trigger={
                                <Button size="sm" variant="ghost">
                                  Edit
                                </Button>
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Contacts */}
          <TabsContent value="contacts" className="mt-0 space-y-3">
            <div className="flex justify-end">
              <ContactForm
                clientId={client.id}
                trigger={
                  <Button size="sm" variant="outline">
                    New contact
                  </Button>
                }
              />
            </div>
            {contacts.length === 0 ? (
              <EmptyState
                title="No contacts yet"
                description="Add a contact to receive invoices or reports."
              />
            ) : (
              <ul className="divide-y rounded-md border">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <div className="min-w-0 space-y-1">
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="truncate font-medium">{c.name}</span>
                        {c.is_primary ? (
                          <StatusBadge status="info" label="Primary" />
                        ) : null}
                        {c.receives_invoices ? (
                          <StatusBadge status="success" label="Invoices" />
                        ) : null}
                        {c.receives_reports ? (
                          <StatusBadge status="success" label="Reports" />
                        ) : null}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {c.email ?? EMPTY_VALUE}
                        {c.phone ? ` · ${c.phone}` : ""}
                      </span>
                    </div>
                    <ContactForm
                      clientId={client.id}
                      contact={c}
                      trigger={
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* Pricing summary (read-only — full edit is the Client Pricing screen, P1-06) */}
          <TabsContent value="pricing" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Pricing summary</CardTitle>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/pricing?client=${client.id}`}>
                    Edit pricing
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pricing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Field
                        label="Hourly rate"
                        value={formatCurrency(pricing.hourly_rate)}
                      />
                      <Field
                        label="Billing increment"
                        value={
                          BILLING_INCREMENT_LABELS[pricing.billing_increment] ??
                          pricing.billing_increment
                        }
                      />
                      <Field
                        label="Hosting price"
                        value={`${formatCurrency(pricing.hosting_price)}${
                          pricing.hosting_cycle
                            ? ` / ${pricing.hosting_cycle}`
                            : ""
                        }`}
                      />
                      <Field
                        label="FileMaker license"
                        value={`${formatCurrency(
                          pricing.filemaker_license_price,
                        )}${
                          pricing.filemaker_license_cycle
                            ? ` / ${pricing.filemaker_license_cycle}`
                            : ""
                        }`}
                      />
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      Last updated {formatDateTime(pricing.updated_at)}. Editing
                      and full price history live on the Client Pricing screen
                      (admin-only).
                    </p>
                  </>
                ) : (
                  <EmptyState
                    title="No pricing set"
                    description="Pricing is managed on the Client Pricing screen (P1-06)."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
