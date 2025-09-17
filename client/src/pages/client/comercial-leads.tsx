import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComercialLeads() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Gerencie seus leads e oportunidades de negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidade de leads em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}