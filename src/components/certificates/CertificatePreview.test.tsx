import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CertificatePreview,
  type CertificateFields,
  type CertificateTextConfig,
  type CertificateSampleData,
} from "./CertificatePreview";

const fields: CertificateFields = {
  showEventName: true,
  showParticipantName: true,
  showParticipantLastName: true,
  showCPF: true,
  showEventDate: true,
  showEventLocation: true,
  showWorkload: true,
  showSigners: true,
};

const textConfig: CertificateTextConfig = {
  title: "CERTIFICADO DE PARTICIPACAO",
  introText: "Certificamos que",
  participationText: "participou do evento",
  conclusionText: "Comprove sua participacao atraves do codigo.",
};

const sampleData: CertificateSampleData = {
  eventName: "Evento de Teste",
  participantName: "Maria Silva",
  participantCPF: "123.456.789-00",
  eventDate: "10/04/2026",
  eventLocation: "Curitiba, PR",
  certificateCode: "CERT-TESTE-123",
};

const baseProps = {
  primaryColor: "#1a365d",
  secondaryColor: "#c9a227",
  fields,
  textConfig,
  signers: [{ name: "Diretor Teste", role: "Diretor" }],
  workloadHours: 8,
  sampleData,
};

describe("CertificatePreview", () => {
  it("renderiza template executive", () => {
    render(<CertificatePreview templateId="executive" {...baseProps} />);
    expect(screen.getByTestId("certificate-preview")).toBeInTheDocument();
    expect(screen.getByTestId("certificate-template-executive")).toBeInTheDocument();
    expect(screen.getByAltText("TicketHall")).toBeInTheDocument();
  });

  it("renderiza template modern", () => {
    render(<CertificatePreview templateId="modern" {...baseProps} />);
    expect(screen.getByTestId("certificate-template-modern")).toBeInTheDocument();
    expect(screen.getByAltText("TicketHall")).toBeInTheDocument();
  });

  it("renderiza template academic", () => {
    render(<CertificatePreview templateId="academic" {...baseProps} />);
    expect(screen.getByTestId("certificate-template-academic")).toBeInTheDocument();
    expect(screen.getByAltText("TicketHall")).toBeInTheDocument();
  });

  it("renderiza template creative e conteudo principal", () => {
    render(<CertificatePreview templateId="creative" {...baseProps} />);
    expect(screen.getByTestId("certificate-preview")).toBeInTheDocument();
    expect(screen.getByTestId("certificate-template-creative")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Evento de Teste")).toBeInTheDocument();
    expect(screen.getByAltText("TicketHall")).toBeInTheDocument();
  });
});
