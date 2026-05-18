"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z, ZodSchema } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export type FieldType = 'text' | 'textarea' | 'toggle' | 'select' | 'email' | 'tel';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  placeholder?: string;
  options?: { label: string; value: string }[]; // For select
  required?: boolean;
}

interface SettingsFormProps {
  title: string;
  description?: string;
  fields: FieldDefinition[];
  defaultValues: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  autoSave?: boolean;
}

export function SettingsForm({ title, description, fields, defaultValues, onSubmit, autoSave = false }: SettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Generate Zod schema dynamically based on fields
  const schemaShape: Record<string, any> = {};
  fields.forEach(field => {
    let fieldSchema: ZodSchema;
    
    if (field.type === 'toggle') {
      fieldSchema = z.boolean();
    } else if (field.type === 'email') {
      fieldSchema = z.string().email('Invalid email address');
      if (!field.required) fieldSchema = fieldSchema.optional().or(z.literal(''));
    } else {
      fieldSchema = z.string();
      if (field.required) fieldSchema = (fieldSchema as import('zod').ZodString).min(1, 'This field is required');
      else fieldSchema = fieldSchema.optional();
    }
    
    schemaShape[field.name] = fieldSchema;
  });

  const formSchema = z.object(schemaShape);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange'
  });

  const { formState: { isDirty } } = form;

  // Handle BeforeUnload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !autoSave) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, autoSave]);

  // Handle Auto-save
  useEffect(() => {
    if (autoSave) {
      const subscription = form.watch((value, { name, type }) => {
        if (type === 'change') {
          // Wrap in timeout to debounce slightly
          const timer = setTimeout(() => {
            form.handleSubmit(handleSubmit)();
          }, 500);
          return () => clearTimeout(timer);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [autoSave, form.watch]);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSaving(true);
    try {
      await onSubmit(data);
      form.reset(data); // Reset form with new values to clear isDirty state
      toast({ title: "Success", description: "Settings saved successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-xl shadow-black/5 overflow-hidden">
      <CardHeader className="bg-muted/10 pb-4 border-b border-border/30 relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {!autoSave && isDirty && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
              <AlertCircle size={12} /> Unsaved Changes
            </Badge>
          )}
        </div>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem className={field.type === 'toggle' ? "flex flex-row items-center justify-between rounded-xl border border-border/50 p-4 shadow-sm" : ""}>
                      <div className={field.type === 'toggle' ? "space-y-0.5" : "space-y-2"}>
                        <FormLabel className="text-sm font-bold">{field.label}</FormLabel>
                        {field.description && (
                          <FormDescription className="text-xs">
                            {field.description}
                          </FormDescription>
                        )}
                      </div>
                      
                      {field.type !== 'toggle' && (
                        <FormControl>
                          {field.type === 'textarea' ? (
                            <Textarea 
                              placeholder={field.placeholder} 
                              className="resize-none min-h-[100px] bg-muted/20" 
                              {...formField} 
                            />
                          ) : field.type === 'select' ? (
                            <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted/20">
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {field.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value} className="font-medium text-sm">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input 
                              type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                              placeholder={field.placeholder} 
                              className="bg-muted/20"
                              {...formField} 
                            />
                          )}
                        </FormControl>
                      )}

                      {field.type === 'toggle' && (
                        <FormControl>
                          <Switch
                            checked={formField.value}
                            onCheckedChange={formField.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                      )}
                      
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </CardContent>
          
          {!autoSave && (
            <CardFooter className="bg-muted/5 border-t border-border/30 p-6 flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={!isDirty || isSaving}
                className="font-bold rounded-xl"
              >
                Discard
              </Button>
              <Button 
                type="submit" 
                disabled={!isDirty || isSaving}
                className="font-bold rounded-xl"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Form>
    </Card>
  );
}
