import {
  AnimatedCard,
  CardBody,
  CardDescription,
  CardTitle,
  CardVisual,
  Visual1,
} from "@/components/ui/animated-card";

export default function AnimatedCard1Demo() {
  return (
    <AnimatedCard>
      <CardVisual>
        <Visual1 mainColor="#ff6900" secondaryColor="#f54900" />
      </CardVisual>
      <CardBody>
        <CardTitle>Dashboard de vendas</CardTitle>
        <CardDescription>
          Acompanhe vendas e performance em tempo real.
        </CardDescription>
      </CardBody>
    </AnimatedCard>
  );
}
