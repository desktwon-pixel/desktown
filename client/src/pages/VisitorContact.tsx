import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin,
  MessageCircle,
  Send,
  Clock,
} from "lucide-react";
import logoUrl from "@/assets/logo-welcome.png";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

export default function VisitorContact() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: language === 'ar' ? 'تم إرسال رسالتك' : 'Message Sent',
      description: language === 'ar' ? 'سنتواصل معك قريباً' : 'We will get back to you soon',
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      label: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'support@onedesk.sa',
    },
    {
      icon: Phone,
      label: language === 'ar' ? 'الهاتف' : 'Phone',
      value: '+966 11 XXX XXXX',
    },
    {
      icon: MapPin,
      label: language === 'ar' ? 'العنوان' : 'Address',
      value: language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
    },
    {
      icon: Clock,
      label: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: language === 'ar' ? 'الأحد - الخميس: 9 ص - 6 م' : 'Sun - Thu: 9 AM - 6 PM',
    },
  ];

  return (
    <div className={`min-h-screen bg-[#0B0F19] text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/welcome">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold text-white">DeskTown</span>
          </div>
        </header>

        {/* Title Section */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p className="text-gray-400">
            {language === 'ar' ? 'نحن هنا لمساعدتك' : 'We are here to help you'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Form */}
          <Card className="bg-[#1a1f2e] border-white/5">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'ar' ? 'أرسل رسالة' : 'Send a Message'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    {language === 'ar' ? 'الاسم' : 'Name'}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-contact-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-contact-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-300">
                    {language === 'ar' ? 'الموضوع' : 'Subject'}
                  </Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={language === 'ar' ? 'موضوع الرسالة' : 'Message subject'}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    required
                    data-testid="input-contact-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-300">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 min-h-[120px]"
                    required
                    data-testid="input-contact-message"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={isSubmitting}
                  data-testid="button-submit-contact"
                >
                  {isSubmitting ? (
                    language === 'ar' ? 'جاري الإرسال...' : 'Sending...'
                  ) : (
                    <>
                      <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'إرسال' : 'Send'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((item, index) => (
              <Card 
                key={index} 
                className="bg-[#1a1f2e] border-white/5"
                data-testid={`card-contact-info-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">{item.label}</p>
                      <p className="text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Back to Welcome */}
        <div className="text-center pt-6">
          <Link href="/welcome">
            <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" data-testid="button-back-to-welcome">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Welcome'}
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
