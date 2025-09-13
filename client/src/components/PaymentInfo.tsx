import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CONTACT_INFO, WORK_TYPES } from '@/utils/constants';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface PaymentInfoProps {
  workType: string;
  paymentArrangement: string;
  totalAmount: number;
  paidAmount?: number;
  submissionId?: string;
}

export const PaymentInfo = ({ 
  workType, 
  paymentArrangement, 
  totalAmount, 
  paidAmount = 0,
  submissionId 
}: PaymentInfoProps) => {
  const [selectedMethod, setSelectedMethod] = useState<'airtel' | 'mtn'>('airtel');
  const [transactionId, setTransactionId] = useState('');
  const { toast } = useToast();
  
  const workInfo = WORK_TYPES[workType];
  const remainingAmount = totalAmount - paidAmount;
  
  const getPaymentAmount = () => {
    switch (paymentArrangement) {
      case '50_50':
        return paidAmount === 0 ? totalAmount * 0.5 : remainingAmount;
      case 'full_upfront':
        return totalAmount;
      case 'full_completion':
        return paidAmount === 0 ? 0 : remainingAmount; // Don't charge until completion
      default:
        return totalAmount;
    }
  };

  const getCurrentPaymentDescription = () => {
    if (paymentArrangement === '50_50') {
      return paidAmount === 0 ? 'First Payment (50%)' : 'Final Payment (50%)';
    } else if (paymentArrangement === 'full_upfront') {
      return 'Full Payment (Upfront)';
    } else {
      return 'Full Payment (On Completion)';
    }
  };

  const paymentAmount = getPaymentAmount();
  const phoneNumber = selectedMethod === 'airtel' ? CONTACT_INFO.airtelMoney : CONTACT_INFO.mtnMoney;
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const handleConfirmPayment = async () => {
    if (paymentAmount === 0) {
      // For full_completion with no payment due, just acknowledge
      toast({
        title: "No Payment Required",
        description: "Payment will be due upon completion of your work.",
      });
      return;
    }

    if (!transactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter your transaction ID to confirm payment",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/payments/confirm', {
        submissionId,
        transactionId: transactionId.trim(),
        amount: paymentAmount,
        description: `${getCurrentPaymentDescription()} for ${workInfo?.label || workType}`
      });

      const result = await response.json();
      
      toast({
        title: "Payment Confirmation Sent",
        description: result.message || "We'll verify your payment and update your submission status soon.",
      });
      
      setTransactionId('');
      
      // Invalidate queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      if (submissionId) {
        queryClient.invalidateQueries({ queryKey: ['/api/submissions', submissionId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Service Type</Label>
              <p className="font-semibold">{workInfo?.label || workType}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Total Amount</Label>
              <p className="font-semibold text-lg">K{totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Amount Paid</Label>
              <p className="font-semibold text-green-600">K{paidAmount.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Amount Due</Label>
              <p className="font-semibold text-red-600">K{remainingAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{getCurrentPaymentDescription()}</span>
              <Badge variant="secondary" className="text-lg font-bold">
                K{paymentAmount.toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={selectedMethod === 'airtel' ? 'default' : 'outline'}
              onClick={() => setSelectedMethod('airtel')}
              className="h-16 justify-start space-x-3"
              data-testid="select-airtel-money"
            >
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">Airtel Money</div>
                <div className="text-sm opacity-75">{CONTACT_INFO.airtelMoney}</div>
              </div>
            </Button>
            
            <Button
              variant={selectedMethod === 'mtn' ? 'default' : 'outline'}
              onClick={() => setSelectedMethod('mtn')}
              className="h-16 justify-start space-x-3"
              data-testid="select-mtn-money"
            >
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="font-semibold">MTN Mobile Money</div>
                <div className="text-sm opacity-75">{CONTACT_INFO.mtnMoney}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      {paymentAmount > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span>Payment Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-3">
            <p className="font-semibold text-blue-800 dark:text-blue-200">
              Step-by-step payment process:
            </p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                <span>Send K{paymentAmount.toLocaleString()} to the number below using {selectedMethod === 'airtel' ? 'Airtel Money' : 'MTN Mobile Money'}</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                <span>Copy the transaction ID from your payment confirmation</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                <span>Enter the transaction ID below and click confirm</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                <span>We'll verify your payment and update your submission status</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Payment Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Payment To:</span>
              <div className="text-right">
                <div className="font-semibold">{CONTACT_INFO.name}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedMethod === 'airtel' ? 'Airtel Money' : 'MTN Money'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Phone Number:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-semibold">{phoneNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(phoneNumber, 'Phone number')}
                  data-testid="copy-phone-number"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Amount:</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">K{paymentAmount.toLocaleString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentAmount.toString(), 'Amount')}
                  data-testid="copy-amount"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {submissionId && (
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span className="font-medium">Reference:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{submissionId}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(submissionId, 'Reference ID')}
                    data-testid="copy-reference-id"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>Payment on Completion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <p className="text-orange-800 dark:text-orange-200">
                <strong>No payment required at this time.</strong> According to your payment arrangement, 
                payment will be due when your work is completed. We'll contact you when it's ready for payment and delivery.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Confirmation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>{paymentAmount > 0 ? 'Confirm Payment' : 'Acknowledge Instructions'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentAmount > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID *</Label>
                <Input
                  id="transaction-id"
                  placeholder="Enter your transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  data-testid="input-transaction-id"
                />
              </div>
              
              <Button
                onClick={handleConfirmPayment}
                className="w-full"
                data-testid="button-confirm-payment"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Payment
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                After confirming, we'll verify your payment within 15-30 minutes during business hours
              </p>
            </>
          ) : (
            <>
              <Button
                onClick={handleConfirmPayment}
                className="w-full"
                variant="outline"
                data-testid="button-acknowledge"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                I Understand - Payment Due on Completion
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                We'll contact you when your work is ready for payment and delivery
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};