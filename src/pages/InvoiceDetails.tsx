import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, Share2, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // <-- Use html2canvas
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import estateHiveLogo from '/favicon_eh.png';

const fetchInvoiceById = async (id: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoiceById(id!),
    enabled: !!id,
  });

  const subtotal = invoice ? invoice.total_amount / 1.18 : 0;
  const cgst = subtotal * 0.09;
  const sgst = subtotal * 0.09;

  const generatePDF = () => {
    // Target the element to be converted to PDF
    const invoiceElement = document.getElementById('invoice-content');
    
    if (!invoiceElement || !invoice) {
        console.error("Could not find invoice element or data.");
        toast({
            title: "Error",
            description: "Could not generate PDF.",
            variant: "destructive",
        });
        return;
    }

    // Use html2canvas to capture the element as a canvas
    html2canvas(invoiceElement, { 
      scale: 3, // Increase scale for better resolution
      useCORS: true, // Needed for external images
      backgroundColor: null // Use element's background
    }).then((canvas) => {
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new PDF in A4 size
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit on the PDF page
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      let newWidth = pdfWidth;
      let newHeight = newWidth / ratio;
      
      // If the calculated height is greater than the page height, scale down
      if (newHeight > pdfHeight) {
        newHeight = pdfHeight;
        newWidth = newHeight * ratio;
      }
      
      const xOffset = (pdfWidth - newWidth) / 2; // Center horizontally

      // Add the image to the PDF and save
      pdf.addImage(imgData, 'PNG', xOffset, 0, newWidth, newHeight);
      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
    });
  };

  const handleShare = async () => {
    if (!invoice) return;
    const shareData = {
      title: `Invoice #${invoice.invoice_number}`,
      text: `Here is the invoice for ${invoice.client_name}. Total amount: ₹${invoice.total_amount.toLocaleString()}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Invoice link copied to clipboard.",
        });
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast({
        title: "Error",
        description: "Could not share the invoice.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #invoice-content, #invoice-content * { visibility: visible; }
        #invoice-content { 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100%;
            border: none !important;
            box-shadow: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  if (!invoice)
    return (
      <div className="flex h-screen items-center justify-center">
        Invoice not found.
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generatePDF}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div
        id="invoice-content"
        className="metric-card max-w-4xl mx-auto p-8 md:p-12 border-2 border-primary/20 bg-white" // Added bg-white for canvas
      >
        <div className="flex justify-between items-start pb-8 border-b">
          <div>
            <img
              src={estateHiveLogo}
              alt="Estate Hive Logo"
              className="h-12 mb-4"
            />
            <h1 className="text-4xl font-bold text-primary">INVOICE</h1>
            <p className="text-muted-foreground mt-1">
              #{invoice.invoice_number}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-foreground">
              Estate Hive Inc.
            </h2>
            <p className="text-sm text-muted-foreground">
              123 Property Lane, Real Estate City
            </p>
            <p className="text-sm text-muted-foreground">
              contact@estatehive.com
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 my-8">
          <div>
            <h3 className="font-semibold text-foreground mb-1">BILL TO</h3>
            <p className="font-medium text-primary">{invoice.client_name}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.client_email}
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-semibold text-foreground">Issue Date:</span>{" "}
              {format(new Date(invoice.issue_date), "PPP")}
            </p>
            <p>
              <span className="font-semibold text-foreground">Due Date:</span>{" "}
              {format(new Date(invoice.due_date), "PPP")}
            </p>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 font-semibold w-full">DESCRIPTION</th>
              <th className="p-3 text-right font-semibold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item: any, index: number) => (
              <tr key={index} className="border-b">
                <td className="p-3">{item.description}</td>
                <td className="p-3 text-right">
                  ₹{Number(item.amount).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6">
          <div className="w-full max-w-sm">
            <div className="flex justify-between py-2 text-muted-foreground">
              <span>Subtotal:</span>
              <span>
                ₹
                {subtotal.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 text-muted-foreground">
              <span>CGST (9%):</span>
              <span>₹{cgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between py-2 text-muted-foreground">
              <span>SGST (9%):</span>
              <span>₹{sgst.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between py-4 border-t-2 border-primary text-xl font-bold text-primary">
              <span>Total Amount:</span>
              <span>
                ₹
                {invoice.total_amount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 mt-8 text-center text-muted-foreground text-sm">
          <p>{invoice.notes || "All payments are due within 30 days. Thank you for your business."}</p>
        </div>
      </div>
    </div>
  );
}