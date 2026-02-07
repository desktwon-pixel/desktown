import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Zap, Info, ExternalLink, Loader2, Check, AlertCircle, Webhook, Key, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { N8nSettings } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

export default function N8nSettingsPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<N8nSettings>({
    queryKey: ['/api/n8n/settings'],
  });

  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setWebhookUrl(settings.webhookUrl || '');
      setApiKey(settings.apiKey || '');
      setIsEnabled(settings.isEnabled || false);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: { webhookUrl?: string; apiKey?: string; isEnabled?: boolean }) => {
      return apiRequest('PUT', '/api/n8n/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/n8n/settings'] });
      toast({
        title: t.n8n?.settingsSaved || "Settings saved",
        description: t.n8n?.settingsSavedDesc || "Your n8n integration settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t.n8n?.error || "Error",
        description: error.message || (t.n8n?.failedSave || "Failed to save settings"),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSettings.mutate({ webhookUrl, apiKey, isEnabled });
  };

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    updateSettings.mutate({ webhookUrl, apiKey, isEnabled: checked });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const iconMargin = language === 'ar' ? 'ml-2' : 'mr-2';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation('/dashboard')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.n8n?.title || "n8n Workflow Automation"}</h1>
          <p className="text-muted-foreground">{t.n8n?.subtitle || "Connect your n8n instance to automate tasks"}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                {t.n8n?.integrationStatus || "Integration Status"}
              </CardTitle>
              <CardDescription>
                {t.n8n?.statusDesc || "Enable or disable the n8n workflow integration"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEnabled ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  {t.n8n?.active || "Active"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {t.n8n?.inactive || "Inactive"}
                </span>
              )}
              <Switch
                checked={isEnabled}
                onCheckedChange={handleToggle}
                data-testid="switch-enable-integration"
              />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              {t.n8n?.webhookConfig || "Webhook Configuration"}
            </CardTitle>
            <CardDescription>
              {t.n8n?.webhookConfigDesc || "Configure your n8n webhook endpoint to receive task automation requests"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">{t.n8n?.webhookUrl || "Webhook URL"}</Label>
              <Input
                id="webhook-url"
                placeholder={t.n8n?.webhookUrlPlaceholder || "https://your-n8n-instance.com/webhook/xxx"}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                data-testid="input-webhook-url"
              />
              <p className="text-sm text-muted-foreground">
                {t.n8n?.webhookUrlHint || "The URL where task data will be sent for workflow processing"}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                {t.n8n?.apiKey || "API Key (Optional)"}
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder={t.n8n?.apiKeyPlaceholder || "Enter your API key for authentication"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                data-testid="input-api-key"
              />
              <p className="text-sm text-muted-foreground">
                {t.n8n?.apiKeyHint || "Optional API key sent in the X-API-Key header for webhook authentication"}
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={updateSettings.isPending}
              data-testid="button-save-settings"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 ${iconMargin} animate-spin`} />
                  {t.n8n?.saving || "Saving..."}
                </>
              ) : (
                t.n8n?.saveConfig || "Save Configuration"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t.n8n?.howItWorks || "How It Works"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{t.n8n?.workflowOverview || "Workflow Overview"}</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>{t.n8n?.step1 || "Send a task to n8n from the Tasks page"}</li>
                  <li>{t.n8n?.step2 || "Your n8n workflow receives the task details via webhook"}</li>
                  <li>{t.n8n?.step3 || "The workflow processes the task and generates a suggested completion"}</li>
                  <li>{t.n8n?.step4 || "n8n sends the result back to CloudOffice"}</li>
                  <li>{t.n8n?.step5 || "You review and approve or reject the suggestion"}</li>
                  <li>{t.n8n?.step6 || "Approved tasks are marked as completed automatically"}</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">{t.n8n?.webhookPayload || "Webhook Payload Format"}</h4>
              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto" dir="ltr">
{`{
  "automationId": 123,
  "taskId": 456,
  "title": "Task title",
  "description": "Task description",
  "priority": "high",
  "dueDate": "2024-01-15T00:00:00Z",
  "callbackUrl": "https://your-app.replit.app/api/automations/callback"
}`}
              </pre>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">{t.n8n?.expectedCallback || "Expected Callback Response"}</h4>
              <pre className="text-xs bg-background p-3 rounded border overflow-x-auto" dir="ltr">
{`POST /api/automations/callback
{
  "automationId": 123,
  "suggestion": "The workflow-generated task completion...",
  "metadata": { "source": "n8n", "executionTime": 1200 },
  "executionId": "n8n-execution-id"
}`}
              </pre>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a 
                href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-n8n-docs"
              >
                <ExternalLink className={`h-4 w-4 ${iconMargin}`} />
                {t.n8n?.viewDocs || "View n8n Webhook Documentation"}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
