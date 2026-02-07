import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  isPushSupported, 
  getNotificationPermission, 
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
} from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NotificationPermissionProps {
  showBanner?: boolean;
}

export function NotificationPermission({ showBanner = true }: NotificationPermissionProps) {
  const { isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      setIsSupported(isPushSupported());
      const perm = await getNotificationPermission();
      setPermission(perm);
      if (perm === 'granted') {
        const subscribed = await isSubscribedToPush();
        setIsSubscribed(subscribed);
      }
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      if (dismissed) {
        setIsDismissed(true);
      }
    };
    checkStatus();
  }, []);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await subscribeToPush();
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications',
        });
      } else {
        toast({
          title: 'Could not enable notifications',
          description: 'Please check your browser settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      await unsubscribeFromPush();
      setIsSubscribed(false);
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications',
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
    setIsLoading(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!isSupported || permission === 'denied' || !isAuthenticated) {
    return null;
  }

  if (showBanner && !isDismissed && permission === 'default') {
    return (
      <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg border border-white/10 glass">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">Enable Notifications</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Get notified about new messages, tasks, and updates
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  data-testid="button-enable-notifications"
                >
                  Enable
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                  data-testid="button-dismiss-notifications"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleDismiss}
              data-testid="button-close-notification-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export function NotificationToggle() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);
      if (supported) {
        const subscribed = await isSubscribedToPush();
        setIsSubscribed(subscribed);
      }
    };
    checkStatus();
  }, []);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
        toast({
          title: 'Notifications disabled',
          description: 'You will no longer receive push notifications',
        });
      } else {
        const success = await subscribeToPush();
        if (success) {
          setIsSubscribed(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will now receive push notifications',
          });
        }
      }
    } catch (error) {
      console.error('Toggle error:', error);
    }
    setIsLoading(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
      data-testid="button-toggle-notifications"
    >
      {isSubscribed ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
}
