import React, { useEffect, useState } from 'react';
import { Button, Banner, Text, Stack } from '@shopify/polaris';

interface DesignData {
  design_id: string;
  preview_url: string;
  print_url: string;
  notes: string;
  productId: string;
  variantId: string;
}

interface CartIntegrationProps {
  productId: string;
  variantId: string;
  onDesignAdded?: (designData: DesignData) => void;
}

const CartIntegration: React.FC<CartIntegrationProps> = ({ 
  productId, 
  variantId, 
  onDesignAdded 
}) => {
  const [designData, setDesignData] = useState<DesignData | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for design saved events
    const handleDesignSaved = (event: CustomEvent) => {
      const { design_id, preview_url, print_url, notes, productId: eventProductId, variantId: eventVariantId } = event.detail;
      
      // Verify this design is for the current product
      if (eventProductId === productId && eventVariantId === variantId) {
        setDesignData({
          design_id,
          preview_url,
          print_url,
          notes,
          productId: eventProductId,
          variantId: eventVariantId,
        });
        
        if (onDesignAdded) {
          onDesignAdded({
            design_id,
            preview_url,
            print_url,
            notes,
            productId: eventProductId,
            variantId: eventVariantId,
          });
        }
      }
    };

    window.addEventListener('designSaved', handleDesignSaved as EventListener);
    
    return () => {
      window.removeEventListener('designSaved', handleDesignSaved as EventListener);
    };
  }, [productId, variantId, onDesignAdded]);

  const addToCart = async () => {
    if (!designData) {
      setError('No design data available. Please complete your design first.');
      return;
    }

    setIsAddingToCart(true);
    setError(null);

    try {
      // Get the current cart form or create one
      const cartForm = document.querySelector('form[action="/cart/add"]') as HTMLFormElement;
      
      if (!cartForm) {
        throw new Error('Cart form not found. Please ensure this is on a product page.');
      }

      // Add design properties to the form
      const addHiddenInput = (name: string, value: string) => {
        let input = cartForm.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          cartForm.appendChild(input);
        }
        input.value = value;
      };

      // Add design properties
      addHiddenInput('properties[design_id]', designData.design_id);
      addHiddenInput('properties[preview_url]', designData.preview_url);
      addHiddenInput('properties[print_url]', designData.print_url);
      addHiddenInput('properties[notes]', designData.notes);

      // Submit the form
      cartForm.submit();
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setError('Failed to add design to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const resetDesign = () => {
    setDesignData(null);
    setError(null);
  };

  if (!designData) {
    return null; // Don't show anything until design is saved
  }

  return (
    <div className="cart-integration">
      <Banner status="success">
        <Stack gap="200">
          <Text variant="bodyMd" as="p">
            <strong>Design Ready!</strong> Your custom design has been saved.
          </Text>
          <Text variant="bodySm" as="p" color="subdued">
            Design ID: {designData.design_id}
          </Text>
          {designData.notes && (
            <Text variant="bodySm" as="p" color="subdued">
              Notes: {designData.notes}
            </Text>
          )}
        </Stack>
      </Banner>

      <div className="cart-actions" style={{ marginTop: '16px' }}>
        <Stack distribution="fillEvenly" gap="200">
          <Button
            onClick={addToCart}
            primary
            loading={isAddingToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? 'Adding to Cart...' : 'Add Design to Cart'}
          </Button>
          
          <Button
            onClick={resetDesign}
            disabled={isAddingToCart}
          >
            Reset Design
          </Button>
        </Stack>
      </div>

      {error && (
        <Banner status="critical" style={{ marginTop: '16px' }}>
          <p>{error}</p>
        </Banner>
      )}

      <style jsx="true">{`
        .cart-integration {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #d0e8d0;
          border-radius: 8px;
          background: #f0f8f0;
        }

        .cart-actions {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};

export default CartIntegration;



