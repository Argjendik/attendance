-- CreateTable
CREATE TABLE "_UserOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserOffices_AB_unique" ON "_UserOffices"("A", "B");
CREATE INDEX "_UserOffices_B_index" ON "_UserOffices"("B");

-- AddForeignKey
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UserOffices" ADD CONSTRAINT "_UserOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "Office"("id") ON DELETE CASCADE ON UPDATE CASCADE; 