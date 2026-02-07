import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage, translations } from "@/lib/i18n";
import { ObjectUploader } from "@/components/ObjectUploader";
import {
  Megaphone,
  CreditCard,
  Eye,
  MousePointer,
  Clock,
  Plus,
  Loader2,
  ExternalLink,
  Trash2,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { SiApplepay, SiVisa } from "react-icons/si";
import type { Advertisement, Subscription } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export default function Advertising() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("apple_pay");

  const PAYMENT_METHODS = [
    { key: "apple_pay", name: t.advertising.applePay, icon: SiApplepay },
    { key: "visa", name: t.advertising.visa, icon: SiVisa },
    { key: "credit_card", name: t.advertising.creditCard, icon: CreditCard },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount) + (language === 'ar' ? ' ريال' : ' SAR');
  };

  const { data: subscription, isLoading: checkingSubscription } = useQuery<Subscription | null>({
    queryKey: ['/api/subscriptions/active'],
  });

  const { data: myAds = [], isLoading: loadingAds } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements/my'],
  });

  const createAd = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/advertisements', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/active'] });
      setShowCreateForm(false);
      resetForm();
      toast({
        title: t.advertising.adCreated,
        description: t.advertising.adCreatedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.advertising.failedToCreateAd,
        description: error.message || t.advertising.pleaseRetry,
        variant: "destructive",
      });
    },
  });

  const deleteAd = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/advertisements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/advertisements/active'] });
      toast({
        title: t.advertising.adDeleted,
        description: t.advertising.adDeletedDesc,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.advertising.failedToDelete,
        description: error.message || t.advertising.pleaseRetry,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setMediaType(null);
    setLinkUrl("");
    setPaymentMethod("apple_pay");
  };

  const handleMediaUpload = async () => {
    const response = await apiRequest("POST", "/api/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL?.uploadURL || data.uploadURL,
    };
  };

  const handleMediaUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const url = result.successful[0].uploadURL;
      setMediaUrl(url);
      const isVideo = url.match(/\.(mp4|webm|mov|avi)$/i);
      setMediaType(isVideo ? "video" : "image");
      toast({
        title: language === 'ar' ? 'تم التحميل بنجاح' : 'Upload successful',
      });
    }
  };

  const handleCreateAd = () => {
    if (!title.trim()) {
      toast({
        title: t.advertising.titleRequired,
        description: t.advertising.titleRequiredDesc,
        variant: "destructive",
      });
      return;
    }

    createAd.mutate({
      title,
      description,
      imageUrl: mediaUrl || null,
      linkUrl: linkUrl || null,
      paymentMethod,
    });
  };

  const getStatusBadge = (ad: Advertisement) => {
    const now = new Date();
    const endDate = ad.endDate ? new Date(ad.endDate) : null;
    
    if (ad.status === 'expired' || (endDate && endDate < now)) {
      return <Badge variant="secondary">{t.advertising.expired}</Badge>;
    }
    if (ad.status === 'active') {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{t.advertising.active}</Badge>;
    }
    if (ad.status === 'pending') {
      return <Badge variant="outline">{t.advertising.pending}</Badge>;
    }
    return <Badge variant="secondary">{ad.status}</Badge>;
  };

  const dateLocale = language === 'ar' ? ar : enUS;

  if (checkingSubscription) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-subscription">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6 max-w-2xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="border-destructive/20">
          <CardHeader>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle>{t.advertising.subscriptionRequired}</CardTitle>
                <CardDescription>
                  {t.advertising.subscriptionRequiredDesc}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t.advertising.subscriptionRequiredInfo}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/subscription'} data-testid="button-subscribe">
              {t.advertising.viewSubscriptionPlans}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between gap-4 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">{t.advertising.title}</h1>
          <p className="text-muted-foreground mt-1">
            {t.advertising.subtitle}
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} data-testid="button-create-ad">
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.advertising.createAd}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {showCreateForm && (
            <Card data-testid="card-create-ad-form">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Megaphone className="h-5 w-5" />
                  {t.advertising.createNewAd}
                </CardTitle>
                <CardDescription>
                  {t.advertising.adDisplayedFor3Days}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ad-title">{t.advertising.adTitleRequired}</Label>
                  <Input
                    id="ad-title"
                    placeholder={t.advertising.enterAdTitle}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-ad-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-description">{t.advertising.adDescription}</Label>
                  <Textarea
                    id="ad-description"
                    placeholder={t.advertising.describeOffer}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="resize-none"
                    rows={3}
                    data-testid="input-ad-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'صورة أو فيديو الإعلان' : 'Ad Image or Video'}</Label>
                  {mediaUrl ? (
                    <div className="relative rounded-lg border overflow-hidden">
                      {mediaType === 'video' ? (
                        <video src={mediaUrl} controls className="w-full max-h-48 object-cover" />
                      ) : (
                        <img src={mediaUrl} alt="Ad preview" className="w-full max-h-48 object-cover" />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setMediaUrl("");
                          setMediaType(null);
                        }}
                        data-testid="button-remove-media"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <ObjectUploader
                      allowedFileTypes={['image/*', 'video/*']}
                      maxFileSize={104857600}
                      onGetUploadParameters={handleMediaUpload}
                      onComplete={handleMediaUploadComplete}
                      buttonClassName="w-full"
                    >
                      <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Upload className="h-4 w-4" />
                        <span>{language === 'ar' ? 'تحميل صورة أو فيديو' : 'Upload Image or Video'}</span>
                      </div>
                    </ObjectUploader>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'يدعم الصور والفيديوهات حتى 100 ميجابايت' : 'Supports images and videos up to 100MB'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-link">{language === 'ar' ? 'رابط الموقع (اختياري)' : 'Website Link (optional)'}</Label>
                  <Input
                    id="ad-link"
                    placeholder="https://your-website.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    data-testid="input-ad-link"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>{t.advertising.paymentMethod}</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    {PAYMENT_METHODS.map((method) => (
                      <Label
                        key={method.key}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover-elevate data-[state=checked]:border-primary ${isRTL ? 'flex-row-reverse' : ''}`}
                        data-state={paymentMethod === method.key ? "checked" : "unchecked"}
                      >
                        <RadioGroupItem value={method.key} data-testid={`radio-payment-${method.key}`} />
                        <method.icon className="h-6 w-6" />
                        <span className="font-medium">{method.name}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  data-testid="button-cancel-ad"
                >
                  {t.advertising.cancel}
                </Button>
                <Button
                  onClick={handleCreateAd}
                  disabled={createAd.isPending}
                  data-testid="button-submit-ad"
                >
                  {createAd.isPending ? (
                    <>
                      <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t.advertising.processing}
                    </>
                  ) : (
                    <>
                      {t.advertising.pay500SAR}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          <Card data-testid="card-my-ads">
            <CardHeader>
              <CardTitle>{t.advertising.myAds}</CardTitle>
              <CardDescription>
                {t.advertising.manageAds}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAds ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myAds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t.advertising.noAdsYet}</p>
                  <p className="text-sm">{t.advertising.createFirstAd}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myAds.map((ad) => (
                    <div
                      key={ad.id}
                      className="p-4 rounded-lg border space-y-3"
                      data-testid={`card-ad-${ad.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex items-start gap-3 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {ad.imageUrl ? (
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="w-16 h-16 rounded-md object-cover bg-muted"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={`flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <h3 className="font-medium truncate">{ad.title}</h3>
                              {getStatusBadge(ad)}
                            </div>
                            {ad.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {ad.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAd.mutate(ad.id)}
                          disabled={deleteAd.isPending}
                          data-testid={`button-delete-ad-${ad.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className={`flex items-center gap-4 text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Eye className="h-4 w-4" />
                          {ad.views || 0} {t.advertising.views}
                        </span>
                        <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <MousePointer className="h-4 w-4" />
                          {ad.clicks || 0} {t.advertising.clicks}
                        </span>
                        {ad.endDate && (
                          <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Clock className="h-4 w-4" />
                            {new Date(ad.endDate) > new Date()
                              ? `${t.advertising.ends} ${formatDistanceToNow(new Date(ad.endDate), { addSuffix: true, locale: dateLocale })}`
                              : `${t.advertising.ended} ${format(new Date(ad.endDate), 'MMM d, yyyy', { locale: dateLocale })}`
                            }
                          </span>
                        )}
                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 text-primary hover:underline ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                            {t.advertising.link}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-pricing-info">
            <CardHeader>
              <CardTitle className="text-lg">{t.advertising.pricing}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{formatCurrency(500)}</div>
                <div className="text-muted-foreground">{t.advertising.for3Days}</div>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm">
                <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.advertising.displayedOnHomepage}
                </li>
                <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.advertising.alongsideOtherAds}
                </li>
                <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.advertising.viewClickTracking}
                </li>
                <li className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t.advertising.linkToWebsite}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-ad-tips">
            <CardHeader>
              <CardTitle className="text-lg">{t.advertising.tipsForSuccess}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{t.advertising.useClearTitles}</strong> - 
                {t.advertising.useClearTitlesDesc}
              </p>
              <p>
                <strong className="text-foreground">{t.advertising.addAnImage}</strong> - 
                {t.advertising.addAnImageDesc}
              </p>
              <p>
                <strong className="text-foreground">{t.advertising.includeALink}</strong> - 
                {t.advertising.includeALinkDesc}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
