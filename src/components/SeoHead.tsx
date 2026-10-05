import React, { useEffect } from 'react';
import { Product, StoreSettings } from '../types';

interface SeoHeadProps {
  settings: StoreSettings;
  products: Product[];
  selectedProduct?: Product | null;
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  settings,
  products,
  selectedProduct,
}) => {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const brandName = `${settings.name || 'Ali'}${settings.suffix || 'clip'}`;
    const origin = window.location.origin;
    const currentUrl = window.location.href;

    // 1. Dynamic Title & Description
    let pageTitle = `${brandName} • Tienda de Cuentas Premium & Membresías IA en Perú`;
    let pageDesc = `Compra membresías de ChatGPT Plus, Streaming 4K, Midjourney y Canva Pro con entrega en 3 minutos por WhatsApp en Perú. Cuentas 100% garantizadas y renovables.`;

    if (selectedProduct) {
      const minPrice = selectedProduct.plans && selectedProduct.plans[0]?.price
        ? selectedProduct.plans[0].price
        : 'S/ 25.00';
      pageTitle = `${selectedProduct.name} desde ${minPrice} • Comprar Cuenta VIP | ${brandName}`;
      pageDesc = `${selectedProduct.desc} Entrega garantizada en menos de 3 minutos, perfil privado con PIN y soporte técnico en Perú.`;
    }

    document.title = pageTitle;

    // Helper to safely set or update meta tag
    const setMetaTag = (attr: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard Meta Tags
    setMetaTag('name', 'description', pageDesc);
    setMetaTag('name', 'keywords', 'cuentas streaming peru, chatgpt plus peru barata, netflix 4k peru, canva pro barato, midjourney, membresias ia, cuentas premium baratas, aliclip, aliclip.site');
    setMetaTag('name', 'author', brandName);
    setMetaTag('name', 'robots', 'index, follow');

    // Default or Product Share Image
    const shareImage = selectedProduct?.imageUrl || `${origin}/og-share-banner.png`;

    // OpenGraph Tags
    setMetaTag('property', 'og:site_name', brandName);
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:type', selectedProduct ? 'product' : 'website');
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', shareImage);
    setMetaTag('property', 'og:image:secure_url', shareImage);
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');

    // Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', shareImage);

    // Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', origin + window.location.pathname);

    // 2. Generate Schema.org Structured Data (JSON-LD)
    const parsePrice = (priceStr: string): number => {
      const match = priceStr.replace(',', '.').match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 25.0;
    };

    // Organization / OnlineStore Schema
    const storeSchema = {
      '@type': 'OnlineStore',
      '@id': `${origin}/#store`,
      name: brandName,
      url: origin,
      description: pageDesc,
      priceRange: 'S/ 15.00 - S/ 120.00',
      currenciesAccepted: 'PEN',
      paymentAccepted: 'Yape, Plin, BCP, Interbank, Transferencia Bancaria',
      telephone: settings.whatsappDisplay || '+51 900 000 000',
      areaServed: {
        '@type': 'Country',
        name: 'Peru',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '15200',
        bestRating: '5',
        worstRating: '1',
      },
    };

    // Products Catalog Schema (ItemList)
    const productListItems = products.slice(0, 24).map((product, idx) => {
      const prices = (product.plans || []).map((p) => parsePrice(p.price));
      const lowPrice = prices.length > 0 ? Math.min(...prices) : 25.0;
      const highPrice = prices.length > 0 ? Math.max(...prices) : 45.0;

      return {
        '@type': 'Product',
        position: idx + 1,
        name: product.name,
        description: product.desc,
        category: product.category === 'ai' ? 'Software de Inteligencia Artificial' : 'Streaming & Entretenimiento Digital',
        image: product.imageUrl || `${origin}/favicon.ico`,
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'PEN',
          lowPrice: lowPrice.toFixed(2),
          highPrice: highPrice.toFixed(2),
          offerCount: (product.plans || []).length || 1,
          availability: product.available !== false
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: brandName,
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '1420',
          bestRating: '5',
        },
      };
    });

    const catalogSchema = {
      '@type': 'ItemList',
      '@id': `${origin}/#catalog`,
      name: `Catálogo de Cuentas Premium y Membresías ${brandName}`,
      numberOfItems: productListItems.length,
      itemListElement: productListItems,
    };

    // Store FAQ Schema for Rich Snippets
    const faqSchema = {
      '@type': 'FAQPage',
      '@id': `${origin}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿En cuánto tiempo entregan mi cuenta o membresía?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La entrega se realiza de forma inmediata vía WhatsApp, con un promedio récord de entre 1 y 3 minutos luego de validar tu pago.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Las cuentas son privadas y con PIN propio?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, todas nuestras cuentas se entregan con perfil privado y contraseña o PIN único para proteger tu privacidad e historial.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué garantía tengo al comprar en Alixplay?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cuentas con garantía completa durante todo el periodo adquirido. Si se presenta cualquier inconveniente técnico, nuestro equipo de soporte lo soluciona o te asigna reposición inmediata.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué métodos de pago aceptan en Perú?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Aceptamos transferencias inmediatas por Yape, Plin, BCP, Interbank y transferencias bancarias directas sin comisiones adicionales.',
          },
        },
      ],
    };

    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [storeSchema, catalogSchema, faqSchema],
    };

    // Inject or update the application/ld+json script tag in <head>
    let scriptTag = document.getElementById('alixplay-jsonld-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'alixplay-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(structuredData);

    return () => {
      // Cleanup on unmount if needed
    };
  }, [settings, products, selectedProduct]);

  return null;
};
