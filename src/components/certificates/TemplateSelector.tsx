/**
 * TemplateSelector Component
 * 
 * Grid showing all 4 certificate templates with live preview using selected colors.
 * Each template shows thumbnail, name, and description with selection highlighting.
 */

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_TEMPLATES,
  type CertificateTemplateId,
} from "@/lib/certificates/templates";

export interface TemplateSelectorProps {
  selectedId: CertificateTemplateId;
  onSelect: (id: CertificateTemplateId) => void;
  primaryColor: string;
  secondaryColor: string;
}

interface TemplateThumbnailProps {
  templateId: CertificateTemplateId;
  primaryColor: string;
  secondaryColor: string;
  isSelected: boolean;
}

/**
 * Mini certificate thumbnail preview for template selection
 */
function TemplateThumbnail({
  templateId,
  primaryColor,
  secondaryColor,
  isSelected,
}: TemplateThumbnailProps) {
  const renderThumbnailContent = () => {
    switch (templateId) {
      case "executive":
        return (
          <div className="relative w-full h-full bg-[#faf8f3] p-2">
            {/* Corner decorations */}
            <div
              className="absolute top-1 left-1 w-3 h-0.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute top-1 left-1 w-0.5 h-3"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute top-1 right-1 w-3 h-0.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute top-1 right-1 w-0.5 h-3"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-1 left-1 w-3 h-0.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-1 left-1 w-0.5 h-3"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-1 right-1 w-3 h-0.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute bottom-1 right-1 w-0.5 h-3"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Content */}
            <div className="h-full flex flex-col items-center justify-center">
              <div
                className="w-4 h-4 rounded-full mb-1"
                style={{ backgroundColor: `${primaryColor}20` }}
              />
              <div
                className="w-8 h-1 mb-0.5"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="w-6 h-0.5 mb-1"
                style={{ backgroundColor: secondaryColor }}
              />
              <div className="w-10 h-0.5 bg-gray-300 mb-0.5" />
              <div className="w-8 h-0.5 bg-gray-300" />
            </div>
          </div>
        );

      case "modern":
        return (
          <div className="relative w-full h-full bg-white p-2">
            {/* Side accent */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 w-1/3 h-1"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Content */}
            <div className="h-full flex flex-col justify-center pl-2">
              <div
                className="w-6 h-1.5 mb-1 rounded-sm"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="w-10 h-0.5 bg-gray-800 mb-0.5" />
              <div className="w-8 h-0.5 bg-gray-400" />
            </div>
            {/* Bottom right shape */}
            <div
              className="absolute bottom-0 right-0 w-6 h-6 opacity-10"
              style={{
                background: `linear-gradient(135deg, transparent 50%, ${primaryColor} 50%)`,
              }}
            />
          </div>
        );

      case "academic":
        return (
          <div className="relative w-full h-full bg-[#fefdf9] p-2">
            {/* Double border */}
            <div
              className="absolute inset-1 border-2 pointer-events-none"
              style={{ borderColor: primaryColor }}
            />
            <div
              className="absolute inset-1.5 border pointer-events-none"
              style={{ borderColor: secondaryColor }}
            />
            {/* Corner medallions */}
            <div
              className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: secondaryColor }}
            />
            {/* Content */}
            <div className="h-full flex flex-col items-center justify-center">
              <div
                className="w-4 h-4 mb-1 rounded-sm"
                style={{ border: `1px solid ${primaryColor}` }}
              />
              <div
                className="w-8 h-0.5 mb-1"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="w-10 h-0.5 bg-gray-300 mb-0.5" />
              <div className="w-6 h-0.5 bg-gray-300" />
            </div>
          </div>
        );

      case "creative":
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 p-2 overflow-hidden">
            {/* Decorative circles */}
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-20"
              style={{ backgroundColor: secondaryColor }}
            />
            <div
              className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full opacity-15"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Corner decorations */}
            <div
              className="absolute top-1 left-1 w-2 h-0.5"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute top-1 left-1 w-0.5 h-2"
              style={{ backgroundColor: primaryColor }}
            />
            {/* Content card */}
            <div className="h-full flex flex-col items-center justify-center">
              <div
                className="px-2 py-0.5 rounded-full mb-1"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <div
                  className="w-3 h-0.5"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <div
                className="w-12 rounded-lg p-1.5 mb-1"
                style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
              >
                <div
                  className="w-6 h-0.5 mb-0.5 mx-auto"
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="w-8 h-0.5 bg-gray-400 mx-auto" />
              </div>
              {/* Detail pills */}
              <div className="flex gap-1">
                <div
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: `${secondaryColor}30` }}
                />
                <div
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: `${secondaryColor}30` }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "w-full aspect-[1.4/1] rounded-md overflow-hidden border-2 transition-all duration-200",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border group-hover:border-primary/50"
      )}
    >
      {renderThumbnailContent()}
    </div>
  );
}

export function TemplateSelector({
  selectedId,
  onSelect,
  primaryColor,
  secondaryColor,
}: TemplateSelectorProps) {
  const templates = Object.values(CERTIFICATE_TEMPLATES);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => {
          const isSelected = selectedId === template.id;

          return (
            <Card
              key={template.id}
              className={cn(
                "group relative cursor-pointer overflow-hidden transition-all duration-200",
                "hover:shadow-md hover:border-primary/30",
                isSelected && "ring-1 ring-primary border-primary"
              )}
              onClick={() => onSelect(template.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(template.id);
                }
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className="p-3">
                {/* Thumbnail Preview */}
                <TemplateThumbnail
                  templateId={template.id}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  isSelected={isSelected}
                />

                {/* Template Info */}
                <div className="mt-3">
                  <h4 className="font-medium text-sm text-foreground">
                    {template.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
